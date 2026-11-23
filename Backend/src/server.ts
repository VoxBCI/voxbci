import { buildApp } from './app.js';
import { loadEnv } from './config/env.js';

/**
 * Server bootstrap: validate config, build the app, listen, shut down cleanly.
 * Everything else lives in `app.ts` so it stays testable without a port.
 */
const env = loadEnv();
const app = await buildApp(env);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    app.log.info({ signal }, 'shutting down');
    void app.close().then(() => process.exit(0));
  });
}

try {
  await app.listen({ host: env.host, port: env.port });
  app.log.info(
    { dev: env.authDevMode, docs: `http://localhost:${env.port}/api/v1/docs` },
    'VoxBCI API ready',
  );
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
