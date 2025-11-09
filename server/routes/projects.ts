import { Router } from 'express';
import { z } from 'zod';
import type { QueryResult, QueryResultRow } from '../db';
import { getPool, query, withTransaction } from '../db';
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
  committed_amount: number | null;
  spent_amount: number | null;
}

interface ProjectDonorAllocation {
  userId: number;
  committedAmount: number;
  spentAmount: number;
}

function mapProject(row: ProjectRow, donors: ProjectDonorAllocation[] = []) {
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
    donatorIds: donors.map((donor) => donor.userId.toString()),
    donorAllocations: donors.map((donor) => ({
      donorId: donor.userId.toString(),
      committedAmount: donor.committedAmount,
      spentAmount: donor.spentAmount,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchDonorAllocationMap(
  projectIds: number[],
): Promise<Map<number, ProjectDonorAllocation[]>> {
  const donorsMap = new Map<number, ProjectDonorAllocation[]>();
  if (projectIds.length === 0) {
    return donorsMap;
  }

  const placeholders = projectIds.map(() => '?').join(',');
  const donorResult = await query<ProjectDonorRow>(
    `SELECT project_id, user_id, committed_amount, spent_amount
       FROM project_donors
      WHERE project_id IN (${placeholders})`,
    projectIds,
  );

  for (const row of donorResult.rows) {
    const allocation: ProjectDonorAllocation = {
      userId: Number(row.user_id),
      committedAmount: Number(row.committed_amount ?? 0),
      spentAmount: Number(row.spent_amount ?? 0),
    };
    const existing = donorsMap.get(row.project_id) ?? [];
    existing.push(allocation);
    donorsMap.set(row.project_id, existing);
  }

  return donorsMap;
}

async function fetchDonorsForProject(projectId: number): Promise<ProjectDonorAllocation[]> {
  const donorsMap = await fetchDonorAllocationMap([projectId]);
  return donorsMap.get(projectId) ?? [];
}

function normalizeDonorAllocations(
  donors: Array<{ userId: string; committedAmount: number; spentAmount?: number }> | undefined,
  fallbackIds?: string[],
): ProjectDonorAllocation[] {
  const normalized = new Map<number, ProjectDonorAllocation>();

  if (Array.isArray(donors)) {
    for (const donor of donors) {
      const userId = Number(donor.userId);
      if (!Number.isFinite(userId)) {
        continue;
      }

      const committedRaw = Number(donor.committedAmount ?? 0);
      const spentRaw = Number(donor.spentAmount ?? 0);
      const committedAmount = Number.isFinite(committedRaw) && committedRaw >= 0 ? committedRaw : 0;
      let spentAmount = Number.isFinite(spentRaw) && spentRaw >= 0 ? spentRaw : 0;
      if (spentAmount > committedAmount) {
        spentAmount = committedAmount;
      }

      normalized.set(userId, { userId, committedAmount, spentAmount });
    }
  }

  if (Array.isArray(fallbackIds)) {
    for (const fallback of fallbackIds) {
      const userId = Number(fallback);
      if (!Number.isFinite(userId) || normalized.has(userId)) {
        continue;
      }

      normalized.set(userId, { userId, committedAmount: 0, spentAmount: 0 });
    }
  }

  return Array.from(normalized.values());
}

function maybeNormalizeDonorAllocations(payload: {
  donorAllocations?: Array<{ userId: string; committedAmount: number; spentAmount?: number }>;
  donatorIds?: string[];
}): ProjectDonorAllocation[] | null {
  if (Array.isArray(payload.donorAllocations)) {
    return normalizeDonorAllocations(payload.donorAllocations, []);
  }

  if (Array.isArray(payload.donatorIds)) {
    return normalizeDonorAllocations(undefined, payload.donatorIds);
  }

  return null;
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

  const donorMap = await fetchDonorAllocationMap(result.rows.map((row) => row.id));
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
  const donorAllocations = await fetchDonorsForProject(projectRow.id);
  const donorIds = donorAllocations.map((allocation) => allocation.userId);

  if (user.role === 'chef_projet' && projectRow.chef_project_id !== user.id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  if (user.role === 'donateur' && !donorIds.includes(user.id)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  return res.json(mapProject(projectRow, donorAllocations));
});

const donorAllocationSchema = z
  .object({
    userId: z.string(),
    committedAmount: z.number().nonnegative(),
    spentAmount: z.number().nonnegative().optional().default(0),
  })
  .superRefine((value, ctx) => {
    if (value.spentAmount > value.committedAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le montant dépensé ne peut pas dépasser le montant engagé.',
        path: ['spentAmount'],
      });
    }
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
  donorAllocations: z.array(donorAllocationSchema).optional().default([]),
});

const projectUpdateSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  status: z.enum(['planning', 'enCours', 'completed', 'paused']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  budget: z.number().nonnegative().optional(),
  spent: z.number().nonnegative().optional(),
  chefProjectId: z.string().optional(),
  donatorIds: z.array(z.string()).optional(),
  donorAllocations: z.array(donorAllocationSchema).optional(),
});

router.post('/', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid project payload' });
  }

  const payload = parsed.data;
  const pool = await getPool();
  const donors = normalizeDonorAllocations(payload.donorAllocations, payload.donatorIds);
  const donorsSpentTotal = donors.reduce((sum, donor) => sum + donor.spentAmount, 0);
  const spentValue = Math.max(payload.spent ?? 0, donorsSpentTotal);

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
      spentValue,
      req.user!.id,
      Number(payload.chefProjectId),
    ],
  );

  const projectId = insertResult.lastInsertRowid!;

  if (donors.length > 0) {
    for (const donor of donors) {
      await pool.query(
        `INSERT OR REPLACE INTO project_donors (project_id, user_id, committed_amount, spent_amount)
         VALUES (?, ?, ?, ?)`,
        [projectId, donor.userId, donor.committedAmount, donor.spentAmount],
      );
    }
  }

  const projectRecord = await query<ProjectRow>(`SELECT * FROM projects WHERE id = ?`, [projectId]);
  const donorAllocations = await fetchDonorsForProject(projectId);

  return res.status(201).json(mapProject(projectRecord.rows[0], donorAllocations));
});

router.put(
  '/:projectId',
  requireAuth,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res) => {
    const projectId = Number(req.params.projectId);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ message: 'Invalid project id' });
    }

    const parsed = projectUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid project payload' });
    }

    const existingResult = await query<ProjectRow>(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    if (existingResult.rowCount === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const existing = existingResult.rows[0];
    const payload = parsed.data;

    const nextValues = {
      name: payload.name ?? existing.name,
      description: payload.description ?? existing.description,
      status: (payload.status ?? existing.status) as ProjectRow['status'],
      startDate: payload.startDate ?? existing.start_date,
      endDate: payload.endDate ?? existing.end_date,
      budget: payload.budget ?? Number(existing.budget ?? 0),
      spent: payload.spent ?? Number(existing.spent ?? 0),
      chefProjectId: Number(payload.chefProjectId ?? existing.chef_project_id),
      adminId: existing.admin_id ?? req.user!.id,
    };

    const donorAllocations = maybeNormalizeDonorAllocations(payload);
    const donorsSpentTotal = donorAllocations
      ? donorAllocations.reduce((sum, donor) => sum + donor.spentAmount, 0)
      : 0;
    if (donorAllocations) {
      nextValues.spent = Math.max(nextValues.spent, donorsSpentTotal);
    }

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE projects
           SET name = ?,
               description = ?,
               status = ?,
               start_date = ?,
               end_date = ?,
               budget = ?,
               spent = ?,
               admin_id = ?,
               chef_project_id = ?,
               updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          nextValues.name,
          nextValues.description,
          nextValues.status,
          nextValues.startDate,
          nextValues.endDate ?? null,
          nextValues.budget,
          nextValues.spent,
          nextValues.adminId,
          nextValues.chefProjectId,
          projectId,
        ],
      );

      if (donorAllocations !== null) {
        await client.query(`DELETE FROM project_donors WHERE project_id = ?`, [projectId]);
        for (const donor of donorAllocations) {
          await client.query(
            `INSERT OR REPLACE INTO project_donors (project_id, user_id, committed_amount, spent_amount)
             VALUES (?, ?, ?, ?)`,
            [projectId, donor.userId, donor.committedAmount, donor.spentAmount],
          );
        }
      }
    });

    const updatedRecord = await query<ProjectRow>(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    const donorAllocationsForProject = await fetchDonorsForProject(projectId);

    return res.json(mapProject(updatedRecord.rows[0], donorAllocationsForProject));
  },
);

router.delete(
  '/:projectId',
  requireAuth,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res) => {
    const projectId = Number(req.params.projectId);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ message: 'Invalid project id' });
    }

    const pool = await getPool();
    const result = await pool.query(`DELETE FROM projects WHERE id = ?`, [projectId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.status(204).send();
  },
);

export default router;
