import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { Env } from '../../config/env.js';
import { AppError } from '../../lib/errors.js';
import type { Store } from '../../store/repositories.js';
import { createRequireAuth, getAuthUser } from '../../plugins/auth.js';
import { PrivateUserSchema, toPrivateUser } from '../users/schemas.js';
import { createUsersService } from '../users/service.js';
import { createAuthService } from './service.js';

export type AuthRoutesOptions = {
  env: Env;
  store: Store;
};

const SessionResponse = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().int().positive(),
  user: PrivateUserSchema,
});

const RefreshBody = z.object({
  refreshToken: z.string().min(1),
});

export const authRoutes: FastifyPluginAsyncZod<AuthRoutesOptions> = async (
  app,
  { env, store },
) => {
  const auth = createAuthService(env, store.users, store.refreshTokens);
  const users = createUsersService(store.users);
  const requireAuth = createRequireAuth(env);

  app.post(
    '/auth/dev-login',
    {
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
      schema: {
        tags: ['auth'],
        summary: 'Development sign-in (AUTH_DEV_MODE only)',
        description:
          'Creates the account on first use. Disabled unless AUTH_DEV_MODE=true, so it cannot exist in production.',
        body: z.object({ email: z.email() }),
        response: { 200: SessionResponse },
      },
    },
    async (request) => {
      if (!env.authDevMode) {
        throw new AppError({
          status: 404,
          code: 'NOT_FOUND',
          message: 'Dev login is disabled on this server',
        });
      }

      const user = await users.ensureUserForEmail(request.body.email);
      return auth.issueSession(user, request.headers['user-agent'] ?? null);
    },
  );

  app.post(
    '/auth/google',
    {
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
      schema: {
        tags: ['auth'],
        summary: 'Sign in with Google',
        description:
          'Verifies a Google ID token from expo-auth-session, then upserts the account. Implemented in build step 8.',
        body: z.object({ idToken: z.string().min(1) }),
        response: { 200: SessionResponse },
      },
    },
    async () => {
      throw new AppError({
        status: 501,
        code: 'GOOGLE_AUTH_NOT_CONFIGURED',
        title: 'Not implemented',
        message:
          'Google sign-in is not wired up yet. Use POST /api/v1/auth/dev-login while AUTH_DEV_MODE=true.',
      });
    },
  );

  app.post(
    '/auth/refresh',
    {
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
      schema: {
        tags: ['auth'],
        summary: 'Rotate a refresh token',
        description:
          'Consumes the presented token and returns a new pair. Reusing a consumed token revokes every session for that user.',
        body: RefreshBody,
        response: { 200: SessionResponse },
      },
    },
    async (request) => auth.rotateSession(request.body.refreshToken, request.headers['user-agent'] ?? null),
  );

  app.post(
    '/auth/logout',
    {
      schema: {
        tags: ['auth'],
        summary: 'Revoke a refresh token',
        body: RefreshBody,
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      await auth.revokeSession(request.body.refreshToken);
      return reply.status(204).send(null);
    },
  );

  app.get(
    '/auth/me',
    {
      preHandler: requireAuth,
      schema: {
        tags: ['auth'],
        summary: 'The signed-in account',
        response: { 200: PrivateUserSchema },
      },
    },
    async (request) => {
      const { id } = getAuthUser(request);
      const user = await users.getById(id);
      return toPrivateUser(user);
    },
  );
};
