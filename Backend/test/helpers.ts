import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { buildApp, type App } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';

export type TestApp = {
  app: App;
  close: () => Promise<void>;
};

/**
 * Boots a full app instance on a throwaway data directory.
 *
 * `app.inject()` exercises routing, validation, auth and serialization without
 * binding a port, so the suite stays fast and can run in parallel.
 */
export async function makeTestApp(
  overrides: Partial<Record<'AUTH_DEV_MODE', string>> = {},
): Promise<TestApp> {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'voxbci-api-'));

  const env = loadEnv({
    NODE_ENV: 'test',
    JWT_SECRET: 'test-only-secret-that-is-long-enough-123456',
    DATA_DIR: dataDir,
    AUTH_DEV_MODE: overrides.AUTH_DEV_MODE ?? 'true',
    CORS_ORIGINS: 'http://localhost:8081',
    PORT: '4001',
  });

  const app = await buildApp(env);

  return {
    app,
    async close() {
      await app.close();
      await rm(dataDir, { recursive: true, force: true });
    },
  };
}

export async function devLogin(app: App, email = 'tobi@example.com') {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/dev-login',
    payload: { email },
  });

  if (response.statusCode !== 200) {
    throw new Error(`dev-login failed: ${response.statusCode} ${response.body}`);
  }

  return response.json() as {
    accessToken: string;
    refreshToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
    user: { id: string; email: string; username: string };
  };
}

export function authHeader(accessToken: string) {
  return { authorization: `Bearer ${accessToken}` };
}
