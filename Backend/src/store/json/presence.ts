import { snapToGrid } from '../../lib/geo.js';
import { addSecondsIso, nowIso } from '../../lib/time.js';
import type { JsonCollection } from '../json-store.js';
import type { PresenceRepo } from '../repositories.js';
import type { Presence, PresenceUpsert } from '../types.js';

const PRESENCE_TTL_SECONDS = 5 * 60;
const DEFAULT_RADIUS_M = 5000;
const MIN_RADIUS_M = 500;
const MAX_RADIUS_M = 50_000;

function clampRadius(radiusM: number | undefined): number {
  const value = radiusM ?? DEFAULT_RADIUS_M;
  return Math.min(MAX_RADIUS_M, Math.max(MIN_RADIUS_M, Math.round(value)));
}

export function createJsonPresenceRepo(collection: JsonCollection<Presence>): PresenceRepo {
  return {
    async upsert(input: PresenceUpsert) {
      const now = nowIso();
      const snapped = snapToGrid(input.lat, input.lng);
      const current = collection.get(input.userId);

      const next: Presence = {
        id: input.userId,
        userId: input.userId,
        lat: snapped.lat,
        lng: snapped.lng,
        accuracyM: input.accuracyM ?? current?.accuracyM ?? null,
        visible: input.visible ?? current?.visible ?? false,
        radiusM: clampRadius(input.radiusM ?? current?.radiusM),
        updatedAt: now,
        expiresAt: addSecondsIso(PRESENCE_TTL_SECONDS),
      };

      if (current) {
        await collection.update(input.userId, next);
      } else {
        await collection.insert(next);
      }

      return next;
    },

    async getByUserId(userId) {
      return collection.get(userId) ?? null;
    },

    async findActiveInBox(box) {
      const now = nowIso();
      return collection.find(
        (row) =>
          row.visible &&
          row.expiresAt > now &&
          row.lat >= box.minLat &&
          row.lat <= box.maxLat &&
          row.lng >= box.minLng &&
          row.lng <= box.maxLng,
      );
    },

    async setVisible(userId, visible, radiusM) {
      const current = collection.get(userId);
      if (!current) return null;

      const next = await collection.update(userId, {
        visible,
        radiusM: clampRadius(radiusM ?? current.radiusM),
        updatedAt: nowIso(),
        expiresAt: addSecondsIso(PRESENCE_TTL_SECONDS),
      });

      return next ?? null;
    },

    async remove(userId) {
      return collection.delete(userId);
    },

    async sweepExpired(nowIsoString) {
      const expired = collection.find((row) => row.expiresAt <= nowIsoString);
      for (const row of expired) await collection.delete(row.id);
      return expired.length;
    },
  };
}
