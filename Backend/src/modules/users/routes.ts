import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { Env } from '../../config/env.js';
import { createRequireAuth, getAuthUser } from '../../plugins/auth.js';
import type { Store } from '../../store/repositories.js';
import type { UserPatch } from '../../store/types.js';
import {
  PrivateUserSchema,
  PublicUserSchema,
  toPrivateUser,
  UsernameSchema,
  UserSettingsSchema,
} from './schemas.js';
import { createUsersService } from './service.js';

export type UserRoutesOptions = {
  env: Env;
  store: Store;
};

const UpdateMeBody = z
  .object({
    displayName: z.string().trim().min(1).max(64).optional(),
    username: UsernameSchema.optional(),
    headline: z.string().trim().max(120).nullable().optional(),
    bio: z.string().trim().max(280).nullable().optional(),
    /** Partial: omitted keys keep their current value. */
    settings: UserSettingsSchema.partial().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'Provide at least one field to update',
  });

export const userRoutes: FastifyPluginAsyncZod<UserRoutesOptions> = async (
  app,
  { env, store },
) => {
  const users = createUsersService(store.users);
  const requireAuth = createRequireAuth(env);

  app.get(
    '/me',
    {
      preHandler: requireAuth,
      schema: {
        tags: ['account'],
        summary: 'Current profile and settings',
        response: { 200: PrivateUserSchema },
      },
    },
    async (request) => toPrivateUser(await users.getById(getAuthUser(request).id)),
  );

  app.patch(
    '/me',
    {
      preHandler: requireAuth,
      schema: {
        tags: ['account'],
        summary: 'Update profile and settings',
        body: UpdateMeBody,
        response: { 200: PrivateUserSchema },
      },
    },
    async (request) => {
      const { id } = getAuthUser(request);
      const current = await users.getById(id);
      const body = request.body;

      // Build the patch explicitly: a key present with value `undefined` would
      // overwrite the stored value during the repository merge.
      const patch: UserPatch = {};
      if (body.displayName !== undefined) patch.displayName = body.displayName;
      if (body.username !== undefined) patch.username = body.username;
      if (body.headline !== undefined) patch.headline = body.headline;
      if (body.bio !== undefined) patch.bio = body.bio;
      if (body.settings) patch.settings = { ...current.settings, ...body.settings };

      return toPrivateUser(await users.updateProfile(id, patch));
    },
  );

  app.get(
    '/users/:id',
    {
      preHandler: requireAuth,
      schema: {
        tags: ['account'],
        summary: 'Public profile card',
        description: 'No email, no settings — safe to show in a chat header or map popup.',
        params: z.object({ id: z.string().min(1) }),
        response: { 200: PublicUserSchema },
      },
    },
    async (request) => users.publicCard(request.params.id),
  );
};
