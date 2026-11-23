import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import type { Env } from './config/env.js';
import { authRoutes } from './modules/auth/routes.js';
import { chatRoutes } from './modules/chats/routes.js';
import { presenceRoutes } from './modules/presence/routes.js';
import { telemetryRoutes } from './modules/telemetry/routes.js';
import { uploadRoutes } from './modules/uploads/routes.js';
import { userRoutes } from './modules/users/routes.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { createJsonStore, type Store } from './store/index.js';
import { createLocalStorageAdapter } from './storage/local.js';
import path from 'node:path';

export type BuildAppOptions = {
  /** Tests pass a store backed by a temp directory. */
  store?: Store;
};

const API_PREFIX = '/api/v1';

/**
 * Builds the Fastify instance without listening on a port.
 *
 * Everything lives behind this function so tests can use `app.inject()` with no
 * network, and so the server bootstrap stays a five-line file.
 */
export async function buildApp(env: Env, options: BuildAppOptions = {}) {
  const app = Fastify({
    logger:
      env.nodeEnv === 'test'
        ? false
        : {
            level: env.logLevel,
            redact: ['req.headers.authorization', 'req.headers.cookie'],
          },
    trustProxy: true,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  registerErrorHandler(app);

  await app.register(cors, {
    origin: env.corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type', 'authorization'],
    maxAge: 86_400,
  });

  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
  });

  // The OpenAPI document is generated from the same Zod schemas that validate
  // requests, so it cannot drift from the implementation.
  await app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'VoxBCI API',
        version: '0.1.0',
        description:
          'Auth, account, presence, chats and telemetry for the VoxBCI app. JSON storage in development; see Backend/ARCHITECTURE.md.',
      },
      servers: [{ url: `http://localhost:${env.port}` }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, {
    routePrefix: `${API_PREFIX}/docs`,
    uiConfig: { docExpansion: 'list', deepLinking: true },
  });

  const store = options.store ?? (await createJsonStore(env.dataDir));
  const storage = createLocalStorageAdapter(path.join(env.dataDir, 'files'), `http://localhost:${env.port}/api/v1`);

  app.get(
    '/healthz',
    { schema: { tags: ['system'], summary: 'Process is up', security: [] } },
    async () => ({ status: 'ok' }),
  );

  app.get(
    '/readyz',
    { schema: { tags: ['system'], summary: 'Store is loaded and writable', security: [] } },
    async () => {
      // A failed flush means the JSON files are not writable; report it rather
      // than accepting writes that would be lost.
      await store.flush();
      return { status: 'ready' };
    },
  );

  await app.register(authRoutes, { prefix: API_PREFIX, env, store });
  await app.register(userRoutes, { prefix: API_PREFIX, env, store });
  await app.register(presenceRoutes, { prefix: API_PREFIX, env, store });
  await app.register(chatRoutes, { prefix: API_PREFIX, env, store });
  await app.register(telemetryRoutes, { prefix: API_PREFIX, env, store });
  await app.register(uploadRoutes, { prefix: API_PREFIX, env, store, storage });

  app.addHook('onClose', async () => {
    await store.flush();
  });

  return app;
}

export type App = Awaited<ReturnType<typeof buildApp>>;
