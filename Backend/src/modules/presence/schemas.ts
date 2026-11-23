import { z } from 'zod';

export const LatLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const PresenceSchema = z.object({
  userId: z.string(),
  lat: z.number(),
  lng: z.number(),
  accuracyM: z.number().nullable(),
  visible: z.boolean(),
  radiusM: z.number().int(),
  updatedAt: z.string(),
  expiresAt: z.string(),
});

export const NearbyPersonSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  headline: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  distanceM: z.number().int(),
  updatedAt: z.string(),
});

export type NearbyPerson = z.infer<typeof NearbyPersonSchema>;
