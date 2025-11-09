import { Router } from 'express';
import { z } from 'zod';
import { getPool, query } from '../db';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth';
import { hashPassword } from '../auth';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  const role = req.query.role as string | undefined;
  let text = `SELECT id, email, first_name, last_name, role, created_at FROM users`;
  const params: any[] = [];
  if (role) {
    text += ' WHERE role = $1';
    params.push(role);
  }
  text += ' ORDER BY created_at DESC';

  const result = await query<{
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'chef_projet' | 'donateur';
    created_at: Date;
  }>(text, params);
  return res.json(
    result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      createdAt: row.created_at,
    })),
  );
});

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: z.enum(['admin', 'chef_projet', 'donateur']),
  password: z.string().min(8),
});

router.post('/', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid user payload' });
  }

  const payload = parsed.data;
  const pool = await getPool();

  const existing = await pool.query(`SELECT 1 FROM users WHERE email = $1`, [payload.email.toLowerCase()]);
  if ((existing.rowCount ?? 0) > 0) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const passwordHash = await hashPassword(payload.password);
  const result = await pool.query<{
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'chef_projet' | 'donateur';
    created_at: Date;
  }>(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, email, first_name, last_name, role, created_at`,
    [payload.email.toLowerCase(), passwordHash, payload.firstName, payload.lastName, payload.role],
  );

  const created = result.rows[0];
  return res.status(201).json({
    id: created.id,
    email: created.email,
    firstName: created.first_name,
    lastName: created.last_name,
    role: created.role,
    createdAt: created.created_at,
  });
});

export default router;
