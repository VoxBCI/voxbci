import path from 'node:path';
import { z } from 'zod';

/**
 * Environment configuration.
 *
 * One validated object instead of scattered `process.env` reads. The server
 * refuses to boot on a missing or nonsensical value — a silent default for
 * `JWT_SECRET` would be a security bug, not a convenience.
 */

const DURATION = /^\d+[smhd]$/;

const RawEnv = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  AUTH_DEV_MODE: z.enum(['true', 'false']).default('true'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL: z.string().regex(DURATION, 'Use a value like 15m, 30s, 1h').default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),

  CORS_ORIGINS: z.string().default('http://localhost:8081'),
  DATA_DIR: z.string().min(1).default('data'),
});

export type Env = {
  readonly nodeEnv: 'development' | 'test' | 'production';
  readonly host: string;
  readonly port: number;
  readonly logLevel: z.infer<typeof RawEnv>['LOG_LEVEL'];
  readonly authDevMode: boolean;
  readonly jwtSecret: string;
  readonly accessTokenTtl: string;
  readonly refreshTokenTtlDays: number;
  readonly corsOrigins: string[];
  readonly dataDir: string;
};

let dotEnvLoaded = false;

function loadDotEnvOnce() {
  if (dotEnvLoaded) return;
  dotEnvLoaded = true;

  try {
    // Node >= 21: reads ./.env relative to the process cwd. Missing file is fine.
    process.loadEnvFile();
  } catch {
    // No .env — fall back to real environment variables.
  }
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  loadDotEnvOnce();

  const parsed = RawEnv.safeParse(source);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `Invalid environment:\n${issues}\n\nCopy Backend/.env.example to Backend/.env and fill it in.`,
    );
  }

  const raw = parsed.data;

  return {
    nodeEnv: raw.NODE_ENV,
    host: raw.HOST,
    port: raw.PORT,
    logLevel: raw.LOG_LEVEL,
    authDevMode: raw.AUTH_DEV_MODE === 'true',
    jwtSecret: raw.JWT_SECRET,
    accessTokenTtl: raw.ACCESS_TOKEN_TTL,
    refreshTokenTtlDays: raw.REFRESH_TOKEN_TTL_DAYS,
    corsOrigins: raw.CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    dataDir: path.resolve(process.cwd(), raw.DATA_DIR),
  };
}
