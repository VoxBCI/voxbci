import { Errors } from '../../lib/errors.js';
import { nowIso } from '../../lib/time.js';
import type { DevicesRepo, IntentsRepo, SessionsRepo } from '../../store/repositories.js';

export function createTelemetryService(devices: DevicesRepo, sessions: SessionsRepo, intents: IntentsRepo) {
  async function listDevices() {
    return devices.list();
  }

  async function createSession(userId: string, deviceId: string) {
    const device = await devices.findById(deviceId);
    if (!device) throw Errors.notFound('Device not found');
    return sessions.create({ userId, deviceId });
  }

  async function endSession(sessionId: string, userId: string) {
    const session = await sessions.findById(sessionId);
    if (!session || session.userId !== userId) throw Errors.notFound('Session not found');
    if (session.status === 'ended') return session;

    const rows = await intents.listBySession(sessionId, { limit: 1000 });
    const count = rows.length;
    const mean = count ? rows.reduce((s, i) => s + i.confidence, 0) / count : 0;
    return (await sessions.end(sessionId, nowIso(), { intents: count, meanConfidence: Math.round(mean * 1000) / 1000 })) ?? session;
  }

  async function listSessions(userId: string, limit: number) {
    return sessions.listForUser(userId, limit);
  }

  async function createIntent(sessionId: string, userId: string, input: { label: string; confidence: number }) {
    const session = await sessions.findById(sessionId);
    if (!session || session.userId !== userId) throw Errors.notFound('Session not found');
    if (session.status !== 'streaming') throw Errors.conflict('SESSION_ENDED', 'Session is not streaming');
    return intents.create({ sessionId, userId, label: input.label, confidence: input.confidence });
  }

  async function listIntents(sessionId: string, userId: string, opts: { before?: string; limit: number }) {
    const session = await sessions.findById(sessionId);
    if (!session || session.userId !== userId) throw Errors.notFound('Session not found');
    return intents.listBySession(sessionId, opts);
  }

  return { listDevices, createSession, endSession, listSessions, createIntent, listIntents };
}
