import bcrypt from 'bcryptjs';
import jwt, { JwtPayload as JwtLibraryPayload, Secret, SignOptions } from 'jsonwebtoken';
import { config } from './config';
import { DbUser } from './db';

export interface JwtPayload {
  sub: number;
  role: 'admin' | 'chef_projet' | 'donateur';
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

const ACCESS_TOKEN_SECRET: Secret = config.accessTokenSecret;
const REFRESH_TOKEN_SECRET: Secret = config.refreshTokenSecret;
const ACCESS_OPTIONS: SignOptions = {
  expiresIn: config.accessTokenTtl as SignOptions['expiresIn'],
};
const REFRESH_OPTIONS: SignOptions = {
  expiresIn: config.refreshTokenTtl as SignOptions['expiresIn'],
};

export function createTokens(user: DbUser): AuthTokens {
  const payload: JwtPayload = { sub: user.id, role: user.role };

  const access_token = jwt.sign(payload, ACCESS_TOKEN_SECRET, ACCESS_OPTIONS);
  const refresh_token = jwt.sign(payload, REFRESH_TOKEN_SECRET, REFRESH_OPTIONS);

  return { access_token, refresh_token };
}

function isRole(value: unknown): value is JwtPayload['role'] {
  return value === 'admin' || value === 'chef_projet' || value === 'donateur';
}

function toJwtPayload(decoded: string | JwtLibraryPayload): JwtPayload | null {
  if (typeof decoded === 'string') {
    return null;
  }
  if (typeof decoded.sub !== 'number' || !isRole(decoded.role)) {
    return null;
  }
  return { sub: decoded.sub, role: decoded.role };
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    return toJwtPayload(decoded);
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
    return toJwtPayload(decoded);
  } catch (error) {
    return null;
  }
}

export function sanitizeUser(user: DbUser) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    createdAt: user.created_at,
  };
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}
