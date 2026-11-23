import { newId } from '../../lib/ids.js';
import { nowIso } from '../../lib/time.js';
import type { JsonCollection } from '../json-store.js';
import type { DevicesRepo, IntentsRepo, SessionsRepo } from '../repositories.js';
import type { Device, Intent, Session } from '../types.js';

export const DEFAULT_DEVICES: Device[] = [
  { id: 'VB-A1F3', name: 'VoxBCI Neuroband', model: 'Neuroband', firmware: '1.4.2', ownerId: null, lastSeenAt: '2026-11-23T00:00:00.000Z' },
  { id: 'VB-B7C2', name: 'VoxBCI Neuroband Pro', model: 'Neuroband Pro', firmware: '1.4.2', ownerId: null, lastSeenAt: '2026-11-23T00:00:00.000Z' },
  { id: 'VB-C4D8', name: 'VoxBCI Lite', model: 'Lite', firmware: '1.2.0', ownerId: null, lastSeenAt: '2026-11-23T00:00:00.000Z' },
  { id: 'VB-D9E1', name: 'VoxBCI Neuroband X', model: 'Neuroband X', firmware: '2.0.0', ownerId: null, lastSeenAt: '2026-11-23T00:00:00.000Z' },
  { id: 'VB-E2F6', name: 'VoxBCI Air', model: 'Air', firmware: '0.9.1', ownerId: null, lastSeenAt: '2026-11-23T00:00:00.000Z' },
];

export function createJsonDevicesRepo(collection: JsonCollection<Device>): DevicesRepo {
  return {
    async list() {
      return collection.all().sort((a, b) => a.name.localeCompare(b.name));
    },
    async findById(id) {
      return collection.get(id) ?? null;
    },
    async upsert(device) {
      const existing = collection.get(device.id);
      if (existing) return (await collection.update(device.id, device)) ?? device;
      return collection.insert(device);
    },
  };
}

export function createJsonSessionsRepo(collection: JsonCollection<Session>): SessionsRepo {
  return {
    async create(input) {
      const session: Session = {
        id: newId(),
        userId: input.userId,
        deviceId: input.deviceId,
        startedAt: nowIso(),
        endedAt: null,
        status: 'streaming',
        stats: { intents: 0, meanConfidence: 0 },
      };
      return collection.insert(session);
    },
    async findById(id) {
      return collection.get(id) ?? null;
    },
    async listForUser(userId, limit) {
      return collection
        .find((s) => s.userId === userId)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .slice(0, limit);
    },
    async end(id, endedAt, stats) {
      return (await collection.update(id, { endedAt, status: 'ended', stats })) ?? null;
    },
  };
}

export function createJsonIntentsRepo(collection: JsonCollection<Intent>): IntentsRepo {
  return {
    async create(input) {
      const intent: Intent = {
        id: newId(),
        sessionId: input.sessionId,
        userId: input.userId,
        label: input.label,
        confidence: input.confidence,
        createdAt: nowIso(),
      };
      return collection.insert(intent);
    },
    async listBySession(sessionId, opts) {
      let rows = collection
        .find((i) => i.sessionId === sessionId)
        .sort((a, b) => b.id.localeCompare(a.id));
      if (opts.before) rows = rows.filter((i) => i.id < opts.before!);
      return rows.slice(0, opts.limit);
    },
  };
}
