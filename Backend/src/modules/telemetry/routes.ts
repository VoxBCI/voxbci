import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { Env } from '../../config/env.js';
import { createRequireAuth, getAuthUser } from '../../plugins/auth.js';
import type { Store } from '../../store/repositories.js';
import { DeviceSchema, IntentSchema, SessionSchema } from './schemas.js';
import { createTelemetryService } from './service.js';

export type TelemetryRoutesOptions = { env: Env; store: Store };

export const telemetryRoutes: FastifyPluginAsyncZod<TelemetryRoutesOptions> = async (app, { env, store }) => {
  const telemetry = createTelemetryService(store.devices, store.sessions, store.intents);
  const requireAuth = createRequireAuth(env);

  app.get('/devices', { preHandler: requireAuth, schema: { tags: ['telemetry'], summary: 'List discoverable headsets', response: { 200: z.array(DeviceSchema) } } },
    async () => telemetry.listDevices());

  app.post('/sessions', { preHandler: requireAuth, schema: { tags: ['telemetry'], summary: 'Start a headset session', body: z.object({ deviceId: z.string().min(1) }), response: { 200: SessionSchema } } },
    async (request) => telemetry.createSession(getAuthUser(request).id, request.body.deviceId));

  app.post('/sessions/:id/end', { preHandler: requireAuth, schema: { tags: ['telemetry'], summary: 'End a session', params: z.object({ id: z.string() }), response: { 200: SessionSchema } } },
    async (request) => telemetry.endSession(request.params.id, getAuthUser(request).id));

  app.get('/sessions', { preHandler: requireAuth, schema: { tags: ['telemetry'], summary: 'List sessions for the signed-in user', querystring: z.object({ limit: z.coerce.number().int().min(1).max(100).default(20) }), response: { 200: z.array(SessionSchema) } } },
    async (request) => telemetry.listSessions(getAuthUser(request).id, request.query.limit));

  app.get('/sessions/:id/intents', { preHandler: requireAuth, schema: { tags: ['telemetry'], summary: 'List intents for a session', params: z.object({ id: z.string() }), querystring: z.object({ before: z.string().optional(), limit: z.coerce.number().int().min(1).max(200).default(50) }), response: { 200: z.array(IntentSchema) } } },
    async (request) => telemetry.listIntents(request.params.id, getAuthUser(request).id, request.query));

  app.post('/sessions/:id/intents', { preHandler: requireAuth, schema: { tags: ['telemetry'], summary: 'Record an intent (device/client ingestion)', params: z.object({ id: z.string() }), body: z.object({ label: z.string().min(1).max(120), confidence: z.number().min(0).max(1) }), response: { 200: IntentSchema } } },
    async (request) => telemetry.createIntent(request.params.id, getAuthUser(request).id, request.body));
};
