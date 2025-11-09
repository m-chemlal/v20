import 'dotenv/config';

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
