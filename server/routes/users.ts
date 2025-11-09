import { Router } from 'express';
import type { QueryResultRow } from '../db';
import { z } from 'zod';
import { getPool, query } from '../db';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth';
import { hashPassword } from '../auth';

const router = Router();

interface UserSummaryRow extends QueryResultRow {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'chef_projet' | 'donateur';
  created_at: string;
}

router.get('/', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  const role = req.query.role as string | undefined;
  let text = `SELECT id, email, first_name, last_name, role, created_at FROM users`;
  const params: any[] = [];
  if (role) {
    text += ' WHERE role = ?';
    params.push(role);
  }
  text += ' ORDER BY created_at DESC';

  const result = await query<UserSummaryRow>(text, params);
  return res.json(
    result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      prenom: row.first_name,
      nom: row.last_name,
      role: row.role,
      createdAt: row.created_at,
      date_creation: row.created_at,
    })),
  );
});

const resolveNameFields = (body: any) => {
  const firstCandidate = typeof body.firstName === 'string' ? body.firstName : body.prenom;
  const lastCandidate = typeof body.lastName === 'string' ? body.lastName : body.nom;

  const firstName =
    typeof firstCandidate === 'string' && firstCandidate.trim().length > 0
      ? firstCandidate.trim()
      : undefined;
  const lastName =
    typeof lastCandidate === 'string' && lastCandidate.trim().length > 0
      ? lastCandidate.trim()
      : undefined;

  return { firstName, lastName };
};

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: z.enum(['admin', 'chef_projet', 'donateur']),
  password: z.string().min(8),
});

const updateUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: z.enum(['admin', 'chef_projet', 'donateur']),
  password: z.string().min(8).optional(),
});

router.post('/', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  const normalizedBody = { ...req.body, ...resolveNameFields(req.body) };
  const parsed = createUserSchema.safeParse(normalizedBody);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid user payload' });
  }

  const payload = parsed.data;
  const pool = await getPool();

  const existing = await pool.query(`SELECT 1 FROM users WHERE email = ?`, [payload.email.toLowerCase()]);
  if ((existing.rowCount ?? 0) > 0) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const passwordHash = await hashPassword(payload.password);
  const result = await pool.query<UserSummaryRow>(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES (?,?,?,?,?)
     RETURNING id, email, first_name, last_name, role, created_at`,
    [payload.email.toLowerCase(), passwordHash, payload.firstName, payload.lastName, payload.role],
  );

  const created = result.rows[0];
  return res.status(201).json({
    id: created.id,
    email: created.email,
    firstName: created.first_name,
    lastName: created.last_name,
    prenom: created.first_name,
    nom: created.last_name,
    role: created.role,
    createdAt: created.created_at,
    date_creation: created.created_at,
  });
});

router.put('/:id', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  const idResult = z.coerce.number().int().positive().safeParse(req.params.id);
  if (!idResult.success) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  const normalizedBody = { ...req.body, ...resolveNameFields(req.body) };
  const parsed = updateUserSchema.safeParse(normalizedBody);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid user payload' });
  }

  const userId = idResult.data;
  const payload = parsed.data;
  const pool = await getPool();

  const existing = await pool.query<UserSummaryRow>(
    `SELECT id, email FROM users WHERE id = ?`,
    [userId],
  );

  if ((existing.rowCount ?? 0) === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  const newEmail = payload.email.toLowerCase();
  if (newEmail !== existing.rows[0].email) {
    const emailCheck = await pool.query(`SELECT 1 FROM users WHERE email = ?`, [newEmail]);
    if ((emailCheck.rowCount ?? 0) > 0) {
      return res.status(409).json({ message: 'Email already in use' });
    }
  }

  const updateParams: any[] = [newEmail, payload.firstName, payload.lastName, payload.role];
  let setClause = 'email = ?, first_name = ?, last_name = ?, role = ?';

  if (payload.password) {
    const passwordHash = await hashPassword(payload.password);
    setClause += ', password_hash = ?';
    updateParams.push(passwordHash);
  }

  updateParams.push(userId);

  const result = await pool.query<UserSummaryRow>(
    `UPDATE users SET ${setClause} WHERE id = ? RETURNING id, email, first_name, last_name, role, created_at`,
    updateParams,
  );

  const updated = result.rows[0];

  return res.json({
    id: updated.id,
    email: updated.email,
    firstName: updated.first_name,
    lastName: updated.last_name,
    prenom: updated.first_name,
    nom: updated.last_name,
    role: updated.role,
    createdAt: updated.created_at,
    date_creation: updated.created_at,
  });
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  const idResult = z.coerce.number().int().positive().safeParse(req.params.id);
  if (!idResult.success) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  const userId = idResult.data;

  if (req.user?.id === userId) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }

  const pool = await getPool();
  const result = await pool.query(`DELETE FROM users WHERE id = ?`, [userId]);

  if ((result.rowCount ?? 0) === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.status(204).send();
});

export default router;
