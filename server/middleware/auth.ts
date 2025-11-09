import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../auth';
import { getPool } from '../db';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'chef_projet' | 'donateur';
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = header.substring('Bearer '.length);
  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const pool = await getPool();
  const result = await pool.query(
    `SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1`,
    [payload.sub],
  );

  if (result.rowCount === 0) {
    return res.status(401).json({ message: 'User not found' });
  }

  const row = result.rows[0];
  req.user = {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
  };

  next();
}

export function requireRole(...roles: Array<'admin' | 'chef_projet' | 'donateur'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    return next();
  };
}
