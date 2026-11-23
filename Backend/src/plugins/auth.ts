import type { FastifyRequest } from 'fastify';

import type { Env } from '../config/env.js';
import { Errors } from '../lib/errors.js';
import { verifyAccessToken } from '../modules/auth/tokens.js';

export type AuthUser = {
  id: string;
  /** Refresh-token family this access token was minted for. */
  sessionId: string;
};

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
}

/**
 * `preHandler` factory for protected routes.
 *
 *   app.get('/me', { preHandler: requireAuth }, handler)
 *
 * The access token is verified locally (HS256), so this costs no I/O.
 */
export function createRequireAuth(env: Env) {
  return async function requireAuth(request: FastifyRequest): Promise<void> {
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';

    if (!token) throw Errors.unauthorized();

    const claims = await verifyAccessToken(env, token);
    if (!claims) throw Errors.unauthorized('Access token is invalid or expired');

    request.authUser = { id: claims.userId, sessionId: claims.sessionId };
  };
}

/** Non-null accessor for handlers behind `requireAuth`. */
export function getAuthUser(request: FastifyRequest): AuthUser {
  const user = request.authUser;
  if (!user) throw Errors.unauthorized();
  return user;
}
