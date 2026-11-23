import type { Env } from '../../config/env.js';
import { AppError, Errors } from '../../lib/errors.js';
import { addDaysIso, nowIso, parseDurationSeconds } from '../../lib/time.js';
import type { RefreshTokensRepo, UsersRepo } from '../../store/repositories.js';
import type { User } from '../../store/types.js';
import { toPrivateUser, type PrivateUser } from '../users/schemas.js';
import {
  createRefreshTokenValue,
  hashRefreshToken,
  signAccessToken,
  verifyAccessToken,
} from './tokens.js';

export type Session = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: PrivateUser;
};

export function createAuthService(
  env: Env,
  users: UsersRepo,
  refreshTokens: RefreshTokensRepo,
) {
  async function issueSession(user: User, userAgent?: string | null): Promise<Session> {
    const refreshToken = createRefreshTokenValue();

    const record = await refreshTokens.create({
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: addDaysIso(env.refreshTokenTtlDays),
      userAgent: userAgent ?? null,
    });

    const accessToken = await signAccessToken(env, { userId: user.id, sessionId: record.id });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: parseDurationSeconds(env.accessTokenTtl),
      user: toPrivateUser(user),
    };
  }

  /**
   * Rotation: every refresh consumes the presented token and issues a new pair.
   * Presenting an already-consumed token means it leaked, so the whole family
   * is revoked and every device is forced to sign in again.
   */
  async function rotateSession(rawToken: string, userAgent?: string | null): Promise<Session> {
    const record = await refreshTokens.findByHash(hashRefreshToken(rawToken));

    if (!record) {
      throw new AppError({
        status: 401,
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is not recognised',
      });
    }

    if (record.revokedAt) {
      const revoked = await refreshTokens.revokeAllForUser(record.userId, nowIso());

      throw new AppError({
        status: 401,
        code: 'REFRESH_TOKEN_REUSED',
        message: `Refresh token was already used; ${revoked} session(s) revoked. Sign in again.`,
      });
    }

    if (record.expiresAt <= nowIso()) {
      throw new AppError({
        status: 401,
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token has expired. Sign in again.',
      });
    }

    await refreshTokens.revoke(record.id, nowIso());

    const user = await users.findById(record.userId);
    if (!user) throw Errors.unauthorized('The account for this session no longer exists');

    return issueSession(user, userAgent);
  }

  async function revokeSession(rawToken: string): Promise<void> {
    const record = await refreshTokens.findByHash(hashRefreshToken(rawToken));
    if (record && !record.revokedAt) {
      await refreshTokens.revoke(record.id, nowIso());
    }
  }

  return { issueSession, rotateSession, revokeSession, verifyAccessToken: (token: string) => verifyAccessToken(env, token) };
}

export type AuthService = ReturnType<typeof createAuthService>;
