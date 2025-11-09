import { Router } from 'express';
import { z } from 'zod';
import { comparePassword, createTokens, sanitizeUser, verifyRefreshToken } from '../auth';
import { getPool } from '../db';
import type { DbUser } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/login', async (req, res) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid credentials payload' });
  }

  const { email, password } = parseResult.data;
  const pool = await getPool();
  const result = await pool.query<DbUser>(
    `SELECT id, email, password_hash, first_name, last_name, role, created_at FROM users WHERE email = ?`,
    [email.toLowerCase()],
  );

  if (result.rowCount === 0) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const user = result.rows[0];
  const passwordValid = await comparePassword(password, user.password_hash);
  if (!passwordValid) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const tokens = createTokens(user);
  return res.json(tokens);
});

const refreshSchema = z.object({ refresh_token: z.string().min(10) });

router.post('/refresh', async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid refresh payload' });
  }

  const payload = verifyRefreshToken(parsed.data.refresh_token);
  if (!payload) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  const pool = await getPool();
  const result = await pool.query<DbUser>(
    `SELECT id, email, password_hash, first_name, last_name, role, created_at FROM users WHERE id = ?`,
    [payload.sub],
  );
  if (result.rowCount === 0) {
    return res.status(401).json({ message: 'User not found' });
  }

  const user = result.rows[0];
  const tokens = createTokens(user);
  return res.json(tokens);
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const pool = await getPool();
  const result = await pool.query<DbUser>(
    `SELECT id, email, password_hash, first_name, last_name, role, created_at FROM users WHERE id = ?`,
    [req.user.id],
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json(sanitizeUser(result.rows[0]));
});

router.post('/logout', (_req, res) => {
  return res.json({ message: 'Logged out' });
});

export default router;
