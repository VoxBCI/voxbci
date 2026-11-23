import { AppError, Errors } from '../../lib/errors.js';
import type { UsersRepo } from '../../store/repositories.js';
import type { User, UserPatch } from '../../store/types.js';
import { toPublicUser, type PublicUser } from './schemas.js';

/** Dates, ids, handles — all the small rules that do not belong in a route. */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function displayNameFromEmail(email: string): string {
  const local = email.slice(0, email.indexOf('@'));
  const cleaned = local.replace(/[._-]+/g, ' ').trim();
  const first = cleaned.split(' ')[0] ?? '';

  return first ? first[0]!.toUpperCase() + first.slice(1) : 'VoxBCI user';
}

/** Deterministic base handle from an email: `tobi.wolaju@…` → `tobi_wolaju`. */
export function baseUsernameFromEmail(email: string): string {
  const local = email.slice(0, email.indexOf('@'));
  const cleaned = local
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20);

  return cleaned.length >= 3 ? cleaned : `user_${cleaned}`.slice(0, 24);
}

export function createUsersService(users: UsersRepo) {
  async function uniqueUsername(base: string): Promise<string> {
    const candidate = base.replace(/[^a-z0-9_]/g, '') || 'user';

    for (let attempt = 0; attempt < 50; attempt += 1) {
      const username = attempt === 0 ? candidate : `${candidate}${attempt + 1}`.slice(0, 24);
      const existing = await users.findByUsername(username);
      if (!existing) return username;
    }

    // Practically unreachable; keeps the loop from returning undefined.
    return `${candidate.slice(0, 16)}${Date.now().toString(36)}`.slice(0, 24);
  }

  async function ensureUserForEmail(email: string): Promise<User> {
    const normalized = normalizeEmail(email);
    const existing = await users.findByEmail(normalized);
    if (existing) return existing;

    return users.create({
      email: normalized,
      displayName: displayNameFromEmail(normalized),
      username: await uniqueUsername(baseUsernameFromEmail(normalized)),
    });
  }

  async function getById(id: string): Promise<User> {
    const user = await users.findById(id);
    if (!user) throw Errors.notFound('User not found');
    return user;
  }

  async function updateProfile(id: string, patch: UserPatch): Promise<User> {
    if (patch.username) {
      const owner = await users.findByUsername(patch.username);
      if (owner && owner.id !== id) {
        throw Errors.conflict('USERNAME_TAKEN', 'That username is already in use');
      }
    }

    const updated = await users.update(id, patch);
    if (!updated) throw Errors.notFound('User not found');

    return updated;
  }

  async function publicCard(id: string): Promise<PublicUser> {
    const user = await users.findById(id);
    if (!user) throw new AppError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' });

    return toPublicUser(user);
  }

  return { ensureUserForEmail, getById, updateProfile, publicCard, uniqueUsername };
}

export type UsersService = ReturnType<typeof createUsersService>;
