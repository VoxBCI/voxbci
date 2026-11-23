import { createHash, randomBytes } from 'node:crypto';

import { jwtVerify, SignJWT } from 'jose';

import type { Env } from '../../config/env.js';

/**
 * Token mechanics.
 *
 * Access token: short-lived JWT (HS256) carrying the user id and the id of the
 * refresh-token family it belongs to. Stateless — no lookup on every request.
 *
 * Refresh token: 32 random bytes, returned once to the client, stored only as a
 * sha256 hash. A stolen JSON file therefore cannot be replayed as a session.
 */

const ALGORITHM = 'HS256';
const ISSUER = 'voxbci-api';
const AUDIENCE = 'voxbci-app';

function secretKey(env: Env): Uint8Array {
  return new TextEncoder().encode(env.jwtSecret);
}

export type AccessTokenClaims = {
  userId: string;
  sessionId: string;
};

export async function signAccessToken(
  env: Env,
  claims: AccessTokenClaims,
): Promise<string> {
  return new SignJWT({ sid: claims.sessionId })
    .setProtectedHeader({ alg: ALGORITHM, typ: 'JWT' })
    .setSubject(claims.userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(env.accessTokenTtl)
    .sign(secretKey(env));
}

export async function verifyAccessToken(
  env: Env,
  token: string,
): Promise<AccessTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(env), {
      algorithms: [ALGORITHM],
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if (typeof payload.sub !== 'string' || payload.sub.length === 0) return null;

    return {
      userId: payload.sub,
      sessionId: typeof payload.sid === 'string' ? payload.sid : '',
    };
  } catch {
    // Expired, tampered with, wrong issuer/audience — all the same answer.
    return null;
  }
}

export function createRefreshTokenValue(): string {
  return randomBytes(32).toString('base64url');
}

export function hashRefreshToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
