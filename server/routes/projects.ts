import { Router } from 'express';
import type { QueryResultRow } from 'pg';
import { z } from 'zod';
import { getPool, query } from '../db';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

interface ProjectRow extends QueryResultRow {
  id: number;
  name: string;
  description: string;
  status: 'planning' | 'enCours' | 'completed' | 'paused';
  start_date: Date;
  end_date: Date | null;
  budget: string | number;
  spent: string | number;
  admin_id: number | null;
  chef_project_id: number;
  created_at: Date;
  updated_at: Date;
  donor_ids?: number[] | null;
}

function mapProject(row: ProjectRow) {
  return {
    id: row.id.toString(),
    name: row.name,
    description: row.description,
    status: row.status as 'planning' | 'enCours' | 'completed' | 'paused',
    startDate: row.start_date,
    endDate: row.end_date,
    budget: Number(row.budget),
    spent: Number(row.spent),
    adminId: row.admin_id?.toString() ?? null,
    chefProjectId: row.chef_project_id.toString(),
    donatorIds: row.donor_ids?.map((value: number) => value.toString()) ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const pool = await getPool();

  let baseQuery = `
    SELECT p.*, COALESCE(array_agg(pd.user_id) FILTER (WHERE pd.user_id IS NOT NULL), '{}') AS donor_ids
    FROM projects p
    LEFT JOIN project_donors pd ON pd.project_id = p.id
  `;
  const params: Array<number> = [];

  if (user.role === 'chef_projet') {
    baseQuery += ' WHERE p.chef_project_id = $1';
    params.push(user.id);
  } else if (user.role === 'donateur') {
    baseQuery += ` INNER JOIN project_donors pd2 ON pd2.project_id = p.id AND pd2.user_id = $1`;
    params.push(user.id);
  }

  baseQuery += ' GROUP BY p.id ORDER BY p.created_at DESC';

  const result = await pool.query<ProjectRow>(baseQuery, params);
  return res.json(result.rows.map(mapProject));
});

router.get('/:projectId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { projectId } = req.params;

  const baseProject = await query<ProjectRow>(
    `SELECT p.*, COALESCE(array_agg(pd.user_id) FILTER (WHERE pd.user_id IS NOT NULL), '{}') AS donor_ids
     FROM projects p
     LEFT JOIN project_donors pd ON pd.project_id = p.id
     WHERE p.id = $1
     GROUP BY p.id`,
    [Number(projectId)],
  );

  if (baseProject.rowCount === 0) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const project = mapProject(baseProject.rows[0]);

  if (user.role === 'chef_projet' && project.chefProjectId !== user.id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }

  if (user.role === 'donateur' && !project.donatorIds.includes(user.id.toString())) {
    return res.status(403).json({ message: 'Access denied' });
  }

  return res.json(project);
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

  const insertResult = await pool.query<ProjectRow>(
    `INSERT INTO projects (name, description, status, start_date, end_date, budget, spent, admin_id, chef_project_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      payload.name,
      payload.description,
      payload.status,
      payload.startDate,
      payload.endDate,
      payload.budget,
      payload.spent ?? 0,
      req.user!.id,
      Number(payload.chefProjectId),
    ],
  );

  const projectRow = insertResult.rows[0];

  if (payload.donatorIds.length > 0) {
    const insertDonorText = `INSERT INTO project_donors (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`;
    for (const donorId of payload.donatorIds) {
      await pool.query(insertDonorText, [projectRow.id, Number(donorId)]);
    }
  }

  const donors = await pool.query<{ user_id: number } & QueryResultRow>(
    `SELECT user_id FROM project_donors WHERE project_id = $1`,
    [projectRow.id],
  );

  return res.status(201).json(
    mapProject({
      ...projectRow,
      donor_ids: donors.rows.map((row) => row.user_id),
    }),
  );
});

export default router;
