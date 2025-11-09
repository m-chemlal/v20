import { Router } from 'express';
import { z } from 'zod';
import type { QueryResultRow } from '../db';
import { getPool, query } from '../db';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

interface IndicatorRow extends QueryResultRow {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  target_value: number;
  current_value: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

interface IndicatorEntryRow extends QueryResultRow {
  id: number;
  indicator_id: number;
  value: number;
  notes: string | null;
  evidence: string | null;
  created_by: number | null;
  created_at: string;
  first_name?: string | null;
  last_name?: string | null;
}

interface ProjectAccess {
  chef_project_id: number;
  donor_ids: number[];
}

function canAccessProject(
  user: { id: number; role: 'admin' | 'chef_projet' | 'donateur' },
  project: ProjectAccess,
) {
  if (user.role === 'admin') {
    return true;
  }
  if (user.role === 'chef_projet') {
    return project.chef_project_id === user.id;
  }
  if (user.role === 'donateur') {
    return project.donor_ids.includes(user.id);
  }
  return false;
}

async function getProjectAccess(projectId: number): Promise<ProjectAccess | null> {
  const projectResult = await query<{ id: number; chef_project_id: number }>(
    `SELECT id, chef_project_id FROM projects WHERE id = ?`,
    [projectId],
  );

  if (projectResult.rowCount === 0) {
    return null;
  }

  const donorsResult = await query<{ user_id: number }>(
    `SELECT user_id FROM project_donors WHERE project_id = ?`,
    [projectId],
  );

  return {
    chef_project_id: projectResult.rows[0].chef_project_id,
    donor_ids: donorsResult.rows.map((row) => row.user_id),
  };
}

router.get('/project/:projectId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const projectId = Number(req.params.projectId);
  const access = await getProjectAccess(projectId);

  if (!access) {
    return res.status(404).json({ message: 'Project not found' });
  }

  if (!canAccessProject(req.user!, access)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const indicators = await query<IndicatorRow>(
    `SELECT * FROM indicators WHERE project_id = ? ORDER BY created_at ASC`,
    [projectId],
  );

  return res.json(
    indicators.rows.map((row) => ({
      id: row.id.toString(),
      projectId: row.project_id.toString(),
      name: row.name,
      description: row.description ?? undefined,
      targetValue: Number(row.target_value),
      currentValue: Number(row.current_value),
      unit: row.unit,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  );
});

const createIndicatorSchema = z.object({
  projectId: z.string(),
  name: z.string().min(3),
  description: z.string().optional().default(''),
  targetValue: z.number().nonnegative(),
  currentValue: z.number().nonnegative(),
  unit: z.string().min(1),
});

router.post('/', requireAuth, requireRole('admin', 'chef_projet'), async (req: AuthenticatedRequest, res) => {
  const parsed = createIndicatorSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid indicator payload' });
  }

  const payload = parsed.data;
  const projectId = Number(payload.projectId);
  const access = await getProjectAccess(projectId);

  if (!access) {
    return res.status(404).json({ message: 'Project not found' });
  }

  if (!canAccessProject(req.user!, access)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const pool = await getPool();
  const insertResult = await pool.query(
    `INSERT INTO indicators (project_id, name, description, target_value, current_value, unit)
     VALUES (?,?,?,?,?,?)`,
    [
      projectId,
      payload.name,
      payload.description,
      payload.targetValue,
      payload.currentValue,
      payload.unit,
    ],
  );

  const indicatorId = insertResult.lastInsertRowid!;
  const indicatorRecord = await query<IndicatorRow>(`SELECT * FROM indicators WHERE id = ?`, [indicatorId]);
  const indicator = indicatorRecord.rows[0];

  return res.status(201).json({
    id: indicator.id.toString(),
    projectId: indicator.project_id.toString(),
    name: indicator.name,
    description: indicator.description ?? undefined,
    targetValue: Number(indicator.target_value),
    currentValue: Number(indicator.current_value),
    unit: indicator.unit,
    createdAt: indicator.created_at,
    updatedAt: indicator.updated_at,
  });
});

const updateIndicatorSchema = z.object({
  currentValue: z.number().nonnegative(),
  notes: z.string().optional().default(''),
  evidence: z.string().url().optional(),
});

router.put('/:indicatorId', requireAuth, requireRole('admin', 'chef_projet'), async (req: AuthenticatedRequest, res) => {
  const parsed = updateIndicatorSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid indicator payload' });
  }

  const indicatorId = Number(req.params.indicatorId);
  const indicatorResult = await query<IndicatorRow>(`SELECT * FROM indicators WHERE id = ?`, [indicatorId]);

  if (indicatorResult.rowCount === 0) {
    return res.status(404).json({ message: 'Indicator not found' });
  }

  const indicatorRow = indicatorResult.rows[0];
  const access = await getProjectAccess(indicatorRow.project_id);

  if (!access) {
    return res.status(404).json({ message: 'Project not found' });
  }

  if (!canAccessProject(req.user!, access)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const pool = await getPool();
  await pool.query(
    `UPDATE indicators SET current_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [parsed.data.currentValue, indicatorId],
  );

  await pool.query(
    `INSERT INTO indicator_entries (indicator_id, value, notes, evidence, created_by)
     VALUES (?,?,?,?,?)`,
    [
      indicatorId,
      parsed.data.currentValue,
      parsed.data.notes ?? '',
      parsed.data.evidence ?? null,
      req.user!.id,
    ],
  );

  const updated = await query<IndicatorRow>(`SELECT * FROM indicators WHERE id = ?`, [indicatorId]);
  const row = updated.rows[0];

  return res.json({
    id: row.id.toString(),
    projectId: row.project_id.toString(),
    name: row.name,
    description: row.description ?? undefined,
    targetValue: Number(row.target_value),
    currentValue: Number(row.current_value),
    unit: row.unit,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
});

router.get('/:indicatorId/entries', requireAuth, async (req: AuthenticatedRequest, res) => {
  const indicatorId = Number(req.params.indicatorId);
  const indicatorResult = await query<IndicatorRow>(`SELECT * FROM indicators WHERE id = ?`, [indicatorId]);

  if (indicatorResult.rowCount === 0) {
    return res.status(404).json({ message: 'Indicator not found' });
  }

  const indicatorRow = indicatorResult.rows[0];
  const access = await getProjectAccess(indicatorRow.project_id);

  if (!access) {
    return res.status(404).json({ message: 'Project not found' });
  }

  if (!canAccessProject(req.user!, access)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const entries = await query<IndicatorEntryRow>(
    `SELECT e.*, u.first_name, u.last_name
       FROM indicator_entries e
       LEFT JOIN users u ON u.id = e.created_by
     WHERE e.indicator_id = ?
     ORDER BY e.created_at ASC`,
    [indicatorId],
  );

  return res.json(
    entries.rows.map((row) => ({
      id: row.id.toString(),
      indicatorId: row.indicator_id.toString(),
      value: Number(row.value),
      notes: row.notes ?? undefined,
      evidence: row.evidence ?? undefined,
      createdAt: row.created_at,
      createdBy: row.created_by != null ? row.created_by.toString() : undefined,
      createdByName:
        row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : undefined,
    })),
  );
});

export default router;
