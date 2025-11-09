import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let usedFallbackEnvLoader = false;

try {
  require('dotenv/config');
} catch (error) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code)
      : undefined;

  if (code === 'ERR_MODULE_NOT_FOUND' || code === 'MODULE_NOT_FOUND') {
    loadEnvFallback();
    usedFallbackEnvLoader = true;
  } else {
    throw error;
  }
}

if (usedFallbackEnvLoader) {
  console.warn(
    '[config] Loaded .env using the built-in fallback parser. Install the "dotenv" package to suppress this message.'
  );
}

function loadEnvFallback() {
  const envFile = resolve(process.cwd(), '.env');
  if (!existsSync(envFile)) {
    return;
  }

  const contents = readFileSync(envFile, 'utf8');
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!key || key in process.env) {
      continue;
    }

    process.env[key] = stripWrappingQuotes(value);
  }
}

function stripWrappingQuotes(value: string) {
  if (value.length >= 2) {
    const startsWithQuote = value.startsWith('"') || value.startsWith("'");
    const endsWithQuote = value.endsWith('"') || value.endsWith("'");
    if (startsWithQuote && endsWithQuote) {
      return value.slice(1, -1);
    }
  }

  return value;
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
