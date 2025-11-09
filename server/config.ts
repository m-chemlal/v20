import { createRequire } from 'module';

const require = createRequire(import.meta.url);

try {
  require('dotenv/config');
} catch (error) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code)
      : undefined;

  if (code === 'ERR_MODULE_NOT_FOUND' || code === 'MODULE_NOT_FOUND') {
    console.warn(
      '[config] dotenv is not installed — environment variables from .env will not be auto-loaded.'
    );
  } else {
    throw error;
  }
}

const DEFAULT_ACCESS_SECRET = 'impacttracker-access-secret-change-me';
const DEFAULT_REFRESH_SECRET = 'impacttracker-refresh-secret-change-me';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET ?? DEFAULT_ACCESS_SECRET,
  refreshTokenSecret:
    process.env.REFRESH_TOKEN_SECRET ?? DEFAULT_REFRESH_SECRET,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? '30m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL ?? '7d',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
