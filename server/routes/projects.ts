import { Router } from 'express';
import { z } from 'zod';
import type { QueryResult, QueryResultRow } from '../db';
import { getPool, query } from '../db';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

interface ProjectRow extends QueryResultRow {
  id: number;
  name: string;
  description: string;
  status: 'planning' | 'enCours' | 'completed' | 'paused' | string;
  start_date: string;
  end_date: string | null;
  budget: number;
  spent: number;
  admin_id: number | null;
  chef_project_id: number;
  created_at: string;
  updated_at: string;
}

interface ProjectDonorRow extends QueryResultRow {
  project_id: number;
  user_id: number;
}

function mapProject(row: ProjectRow, donorIds: number[] = []) {
  return {
    id: row.id.toString(),
    name: row.name,
    description: row.description,
    status: row.status as 'planning' | 'enCours' | 'completed' | 'paused',
    startDate: row.start_date,
    endDate: row.end_date,
    budget: Number(row.budget ?? 0),
    spent: Number(row.spent ?? 0),
    adminId: row.admin_id != null ? row.admin_id.toString() : null,
    chefProjectId: row.chef_project_id.toString(),
    donatorIds: donorIds.map((value) => value.toString()),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchDonorMap(projectIds: number[]): Promise<Map<number, number[]>> {
  const donorsMap = new Map<number, number[]>();
  if (projectIds.length === 0) {
    return donorsMap;
  }

  const placeholders = projectIds.map(() => '?').join(',');
  const donorResult = await query<ProjectDonorRow>(
    `SELECT project_id, user_id FROM project_donors WHERE project_id IN (${placeholders})`,
    projectIds,
  );

  for (const row of donorResult.rows) {
    const existing = donorsMap.get(row.project_id);
    if (existing) {
      existing.push(row.user_id);
    } else {
      donorsMap.set(row.project_id, [row.user_id]);
    }
  }

  return donorsMap;
}

async function fetchDonorsForProject(projectId: number): Promise<number[]> {
  const donorsMap = await fetchDonorMap([projectId]);
  return donorsMap.get(projectId) ?? [];
}

router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;

  let result: QueryResult<ProjectRow>;
  if (user.role === 'admin') {
    result = await query<ProjectRow>(`SELECT * FROM projects ORDER BY created_at DESC`);
  } else if (user.role === 'chef_projet') {
    result = await query<ProjectRow>(
      `SELECT * FROM projects WHERE chef_project_id = ? ORDER BY created_at DESC`,
      [user.id],
    );
  } else {
    result = await query<ProjectRow>(
      `SELECT p.* FROM projects p
         INNER JOIN project_donors pd ON pd.project_id = p.id
       WHERE pd.user_id = ?
       ORDER BY p.created_at DESC`,
      [user.id],
    );
  }

  const donorMap = await fetchDonorMap(result.rows.map((row) => row.id));
  return res.json(result.rows.map((row) => mapProject(row, donorMap.get(row.id) ?? [])));
});

router.get('/:projectId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const projectId = Number(req.params.projectId);

  const projectResult = await query<ProjectRow>(`SELECT * FROM projects WHERE id = ?`, [projectId]);
  if (projectResult.rowCount === 0) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const projectRow = projectResult.rows[0];
  const donorIds = await fetchDonorsForProject(projectRow.id);

  if (user.role === 'chef_projet' && projectRow.chef_project_id !== user.id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  if (user.role === 'donateur' && !donorIds.includes(user.id)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  return res.json(mapProject(projectRow, donorIds));
});

const createProjectSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  status: z.enum(['planning', 'enCours', 'completed', 'paused']).default('planning'),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  budget: z.number().nonnegative(),
  spent: z.number().nonnegative().optional().default(0),
  chefProjectId: z.string(),
  donatorIds: z.array(z.string()).optional().default([]),
});

router.post('/', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid project payload' });
  }

  const payload = parsed.data;
  const pool = await getPool();

  const insertResult = await pool.query(
    `INSERT INTO projects (name, description, status, start_date, end_date, budget, spent, admin_id, chef_project_id)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      payload.name,
      payload.description,
      payload.status,
      payload.startDate,
      payload.endDate ?? null,
      payload.budget,
      payload.spent ?? 0,
      req.user!.id,
      Number(payload.chefProjectId),
    ],
  );

  const projectId = insertResult.lastInsertRowid!;

  if (payload.donatorIds.length > 0) {
    for (const donorId of payload.donatorIds) {
      await pool.query(`INSERT OR IGNORE INTO project_donors (project_id, user_id) VALUES (?, ?)`, [
        projectId,
        Number(donorId),
      ]);
    }
  }

  const projectRecord = await query<ProjectRow>(`SELECT * FROM projects WHERE id = ?`, [projectId]);
  const donorIds = await fetchDonorsForProject(projectId);

  return res.status(201).json(mapProject(projectRecord.rows[0], donorIds));
});

export default router;
