import { newId } from '../../lib/ids.js';
import { nowIso } from '../../lib/time.js';
import type { JsonCollection } from '../json-store.js';
import type { UsersRepo } from '../repositories.js';
import { DEFAULT_SETTINGS, type NewUser, type User, type UserPatch } from '../types.js';

export function createJsonUsersRepo(collection: JsonCollection<User>): UsersRepo {
  return {
    async create(input: NewUser) {
      const timestamp = nowIso();

      const user: User = {
        id: newId(),
        email: input.email,
        googleSub: input.googleSub ?? null,
        displayName: input.displayName,
        username: input.username,
        avatarUrl: null,
        headline: null,
        bio: null,
        settings: { ...DEFAULT_SETTINGS },
        devices: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      return collection.insert(user);
    },

    async findById(id) {
      return collection.get(id) ?? null;
    },

    async findByEmail(email) {
      const needle = email.toLowerCase();
      return collection.findOne((user) => user.email.toLowerCase() === needle) ?? null;
    },

    async findByUsername(username) {
      const needle = username.toLowerCase();
      return collection.findOne((user) => user.username.toLowerCase() === needle) ?? null;
    },

    async findByGoogleSub(googleSub) {
      return collection.findOne((user) => user.googleSub === googleSub) ?? null;
    },

    async update(id: string, patch: UserPatch) {
      const updated = await collection.update(id, {
        ...patch,
        ...(patch.settings ? { settings: { ...patch.settings } } : {}),
        updatedAt: nowIso(),
      });

      return updated ?? null;
    },

    async count() {
      return collection.count();
    },
  };
}
