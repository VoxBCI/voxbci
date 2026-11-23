import { boundingBox, haversineMeters } from '../../lib/geo.js';
import { nowIso } from '../../lib/time.js';
import type { PresenceRepo, UsersRepo } from '../../store/repositories.js';
import type { Presence } from '../../store/types.js';
import type { NearbyPerson } from './schemas.js';

export type NearbyQuery = {
  lat: number;
  lng: number;
  radiusM: number;
  limit: number;
};

export function createPresenceService(presence: PresenceRepo, users: UsersRepo) {
  async function upsertLocation(input: {
    userId: string;
    lat: number;
    lng: number;
    accuracyM?: number | null;
  }): Promise<Presence> {
    return presence.upsert(input);
  }

  async function setVisibility(userId: string, visible: boolean, radiusM?: number): Promise<Presence> {
    const existing = await presence.getByUserId(userId);

    if (existing) {
      const updated = await presence.setVisible(userId, visible, radiusM);
      return updated ?? existing;
    }

    // Opt-in without a prior location: create a hidden row so the preference is
    // recorded; it won't appear in nearby until the client sends coordinates.
    return presence.upsert({
      userId,
      lat: 0,
      lng: 0,
      visible,
      radiusM,
      accuracyM: null,
    });
  }

  async function remove(userId: string): Promise<void> {
    await presence.remove(userId);
  }

  async function nearby(query: NearbyQuery & { userId: string }): Promise<NearbyPerson[]> {
    await presence.sweepExpired(nowIso());

    const box = boundingBox(query.lat, query.lng, query.radiusM);
    const candidates = await presence.findActiveInBox(box);

    const people: NearbyPerson[] = [];

    for (const row of candidates) {
      // Never show the requester to themselves.
      if (row.userId === query.userId) continue;

      const distanceM = Math.round(haversineMeters(query, row));
      if (distanceM > query.radiusM) continue;

      // Respect the other person's discovery radius too.
      if (distanceM > row.radiusM) continue;

      const user = await users.findById(row.userId);
      if (!user) continue;

      people.push({
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        avatarUrl: user.avatarUrl,
        headline: user.headline,
        lat: row.lat,
        lng: row.lng,
        distanceM,
        updatedAt: row.updatedAt,
      });
    }

    people.sort((a, b) => a.distanceM - b.distanceM || a.displayName.localeCompare(b.displayName));

    return people.slice(0, query.limit);
  }

  return { upsertLocation, setVisibility, remove, nearby };
}

export type PresenceService = ReturnType<typeof createPresenceService>;
