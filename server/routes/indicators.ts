import { Router } from 'express';
import { z } from 'zod';
import { getPool, query } from '../db';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

interface IndicatorRow {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  target_value: string | number;
  current_value: string | number;
  unit: string;
  created_at: Date;
  updated_at: Date;
}

interface IndicatorEntryRow {
  id: number;
  indicator_id: number;
  value: string | number;
  notes: string | null;
  evidence: string | null;
  created_by: number | null;
  created_at: Date;
  first_name: string | null;
  last_name: string | null;
}

function canAccessProject(user: { id: number; role: 'admin' | 'chef_projet' | 'donateur' }, project: any) {
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

router.get('/project/:projectId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { projectId } = req.params;
  const projectResult = await query(
    `SELECT p.id, p.chef_project_id,
            COALESCE(array_agg(pd.user_id) FILTER (WHERE pd.user_id IS NOT NULL), '{}') AS donor_ids
     FROM projects p
     LEFT JOIN project_donors pd ON pd.project_id = p.id
     WHERE p.id = $1
     GROUP BY p.id`,
    [Number(projectId)],
  );

  if (projectResult.rowCount === 0) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const project = projectResult.rows[0];
  if (!canAccessProject(req.user!, project)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const indicators = await query<IndicatorRow>(
    `SELECT * FROM indicators WHERE project_id = $1 ORDER BY created_at ASC`,
    [Number(projectId)],
  );

  return res.json(
    indicators.rows.map((row) => ({
      id: row.id.toString(),
      projectId: row.project_id.toString(),
      name: row.name,
      description: row.description,
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

  const projectResult = await query(
    `SELECT p.id, p.chef_project_id,
            COALESCE(array_agg(pd.user_id) FILTER (WHERE pd.user_id IS NOT NULL), '{}') AS donor_ids
     FROM projects p
     LEFT JOIN project_donors pd ON pd.project_id = p.id
     WHERE p.id = $1
     GROUP BY p.id`,
    [projectId],
  );

  if (projectResult.rowCount === 0) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const project = projectResult.rows[0];
  if (!canAccessProject(req.user!, project)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const pool = await getPool();
  const insertResult = await pool.query(
    `INSERT INTO indicators (project_id, name, description, target_value, current_value, unit)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      projectId,
      payload.name,
      payload.description,
      payload.targetValue,
      payload.currentValue,
      payload.unit,
    ],
  );

  const indicator = insertResult.rows[0];
  return res.status(201).json({
    id: indicator.id.toString(),
    projectId: indicator.project_id.toString(),
    name: indicator.name,
    description: indicator.description,
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
  const indicatorResult = await query(
    `SELECT i.*, p.chef_project_id,
            COALESCE(array_agg(pd.user_id) FILTER (WHERE pd.user_id IS NOT NULL), '{}') AS donor_ids
     FROM indicators i
     INNER JOIN projects p ON p.id = i.project_id
     LEFT JOIN project_donors pd ON pd.project_id = p.id
     WHERE i.id = $1
     GROUP BY i.id, p.chef_project_id`,
    [indicatorId],
  );

  if (indicatorResult.rowCount === 0) {
    return res.status(404).json({ message: 'Indicator not found' });
  }

  const indicatorRow = indicatorResult.rows[0];
  if (!canAccessProject(req.user!, indicatorRow)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const pool = await getPool();
  await pool.query(
    `UPDATE indicators
     SET current_value = $1, updated_at = NOW()
     WHERE id = $2`,
    [parsed.data.currentValue, indicatorId],
  );

  await pool.query(
    `INSERT INTO indicator_entries (indicator_id, value, notes, evidence, created_by)
     VALUES ($1,$2,$3,$4,$5)` ,
    [indicatorId, parsed.data.currentValue, parsed.data.notes, parsed.data.evidence ?? null, req.user!.id],
  );

  const updated = await query(`SELECT * FROM indicators WHERE id = $1`, [indicatorId]);
  const row = updated.rows[0];

  return res.json({
    id: row.id.toString(),
    projectId: row.project_id.toString(),
    name: row.name,
    description: row.description,
    targetValue: Number(row.target_value),
    currentValue: Number(row.current_value),
    unit: row.unit,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
});

router.get('/:indicatorId/entries', requireAuth, async (req: AuthenticatedRequest, res) => {
  const indicatorId = Number(req.params.indicatorId);
  const indicatorResult = await query(
    `SELECT i.*, p.chef_project_id,
            COALESCE(array_agg(pd.user_id) FILTER (WHERE pd.user_id IS NOT NULL), '{}') AS donor_ids
     FROM indicators i
     INNER JOIN projects p ON p.id = i.project_id
     LEFT JOIN project_donors pd ON pd.project_id = p.id
     WHERE i.id = $1
     GROUP BY i.id, p.chef_project_id`,
    [indicatorId],
  );

  if (indicatorResult.rowCount === 0) {
    return res.status(404).json({ message: 'Indicator not found' });
  }

  const indicatorRow = indicatorResult.rows[0];
  if (!canAccessProject(req.user!, indicatorRow)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const entries = await query<IndicatorEntryRow>(
    `SELECT e.*, u.first_name, u.last_name
     FROM indicator_entries e
     LEFT JOIN users u ON u.id = e.created_by
     WHERE e.indicator_id = $1
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
      createdBy: row.created_by?.toString() ?? undefined,
      createdByName:
        row.first_name && row.last_name
          ? `${row.first_name} ${row.last_name}`
          : undefined,
    })),
  );
});

export default router;
