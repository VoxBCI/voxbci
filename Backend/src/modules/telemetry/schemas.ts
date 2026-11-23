import { z } from 'zod';

export const DeviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  model: z.string(),
  firmware: z.string(),
  ownerId: z.string().nullable(),
  lastSeenAt: z.string(),
});

export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  deviceId: z.string(),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  status: z.enum(['streaming', 'ended']),
  stats: z.object({ intents: z.number().int(), meanConfidence: z.number() }),
});

export const IntentSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  userId: z.string(),
  label: z.string(),
  confidence: z.number(),
  createdAt: z.string(),
});
