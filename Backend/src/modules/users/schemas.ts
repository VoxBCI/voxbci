import { z } from 'zod';

import type { User } from '../../store/types.js';

export const UsernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,24}$/, 'Use 3–24 characters: a–z, 0–9, underscore');

export const UserSettingsSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']),
  units: z.enum(['metric', 'imperial']),
  haptics: z.boolean(),
});

export const PublicUserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  headline: z.string().nullable(),
  bio: z.string().nullable(),
});

export const PrivateUserSchema = PublicUserSchema.extend({
  email: z.string(),
  settings: UserSettingsSchema,
  devices: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PublicUser = z.infer<typeof PublicUserSchema>;
export type PrivateUser = z.infer<typeof PrivateUserSchema>;

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    avatarUrl: user.avatarUrl,
    headline: user.headline,
    bio: user.bio,
  };
}

export function toPrivateUser(user: User): PrivateUser {
  return {
    ...toPublicUser(user),
    email: user.email,
    settings: user.settings,
    devices: user.devices,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
