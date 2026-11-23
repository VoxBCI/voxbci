import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { Env } from '../../config/env.js';
import { getAuthUser, createRequireAuth } from '../../plugins/auth.js';
import type { Store } from '../../store/repositories.js';
import { NearbyPersonSchema, PresenceSchema } from './schemas.js';
import { createPresenceService } from './service.js';

export type PresenceRoutesOptions = {
  env: Env;
  store: Store;
};

const RadiusSchema = z.coerce.number().int().min(500).max(50_000);

export const presenceRoutes: FastifyPluginAsyncZod<PresenceRoutesOptions> = async (
  app,
  { env, store },
) => {
  const presence = createPresenceService(store.presence, store.users);
  const requireAuth = createRequireAuth(env);

  app.put(
    '/presence/location',
    {
      preHandler: requireAuth,
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
      schema: {
        tags: ['presence'],
        summary: 'Report current location',
        description:
          'Coordinates are snapped to a ~150m privacy grid before storage. Presence expires after 5 minutes without an update.',
        body: z.object({
          lat: z.number().min(-90).max(90),
          lng: z.number().min(-180).max(180),
          accuracyM: z.number().min(0).max(100_000).nullable().optional(),
        }),
        response: { 200: PresenceSchema },
      },
    },
    async (request) => {
      const { id } = getAuthUser(request);
      return presence.upsertLocation({ userId: id, ...request.body });
    },
  );

  app.patch(
    '/presence',
    {
      preHandler: requireAuth,
      schema: {
        tags: ['presence'],
        summary: 'Set visibility and discovery radius',
        body: z
          .object({
            visible: z.boolean().optional(),
            radiusM: RadiusSchema.optional(),
          })
          .refine((body) => body.visible !== undefined || body.radiusM !== undefined, {
            message: 'Provide visible and/or radiusM',
          }),
        response: { 200: PresenceSchema },
      },
    },
    async (request) => {
      const { id } = getAuthUser(request);
      const current = await store.presence.getByUserId(id);
      const visible = request.body.visible ?? current?.visible ?? false;
      return presence.setVisibility(id, visible, request.body.radiusM);
    },
  );

  app.delete(
    '/presence',
    {
      preHandler: requireAuth,
      schema: {
        tags: ['presence'],
        summary: 'Go dark (remove presence)',
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      await presence.remove(getAuthUser(request).id);
      return reply.status(204).send(null);
    },
  );

  app.get(
    '/presence/nearby',
    {
      preHandler: requireAuth,
      schema: {
        tags: ['presence'],
        summary: 'Find nearby visible users',
        description:
          'Returns public profile cards with snapped coordinates. Excludes the requester, expired rows, and users outside each other’s radius.',
        querystring: z.object({
          lat: z.coerce.number().min(-90).max(90),
          lng: z.coerce.number().min(-180).max(180),
          radiusM: RadiusSchema.default(5000),
          limit: z.coerce.number().int().min(1).max(100).default(50),
        }),
        response: { 200: z.array(NearbyPersonSchema) },
      },
    },
    async (request) => {
      const { id } = getAuthUser(request);
      return presence.nearby({ userId: id, ...request.query });
    },
  );
};
