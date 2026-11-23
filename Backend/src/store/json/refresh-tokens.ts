import { newId } from '../../lib/ids.js';
import { nowIso } from '../../lib/time.js';
import type { JsonCollection } from '../json-store.js';
import type { RefreshTokensRepo } from '../repositories.js';
import type { NewRefreshToken, RefreshToken } from '../types.js';

export function createJsonRefreshTokensRepo(
  collection: JsonCollection<RefreshToken>,
): RefreshTokensRepo {
  return {
    async create(input: NewRefreshToken) {
      const token: RefreshToken = {
        id: newId(),
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        createdAt: nowIso(),
        revokedAt: null,
        userAgent: input.userAgent ?? null,
      };

      return collection.insert(token);
    },

    async findByHash(tokenHash) {
      return collection.findOne((token) => token.tokenHash === tokenHash) ?? null;
    },

    async revoke(id, revokedAt) {
      await collection.update(id, { revokedAt });
    },

    async revokeAllForUser(userId, revokedAt) {
      const active = collection.find(
        (token) => token.userId === userId && token.revokedAt === null,
      );

      for (const token of active) {
        await collection.update(token.id, { revokedAt });
      }

      return active.length;
    },

    async deleteExpired(nowIsoString) {
      // Revoked tokens are kept until they expire: their presence is what lets
      // us tell "reused token" (revoke everything) from "unknown token".
      const expired = collection.find((token) => token.expiresAt <= nowIsoString);

      for (const token of expired) {
        await collection.delete(token.id);
      }

      return expired.length;
    },
  };
}
