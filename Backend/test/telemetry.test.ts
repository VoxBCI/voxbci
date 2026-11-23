import { afterEach, describe, expect, it } from 'vitest';

import { authHeader, devLogin, makeTestApp, type TestApp } from './helpers.js';

let context: TestApp | undefined;
afterEach(async () => { await context?.close(); context = undefined; });

describe('telemetry', () => {
  it('lists devices, creates session, records intents, ends session', async () => {
    context = await makeTestApp();
    const me = await devLogin(context.app, 'me@example.com');

    const devices = await context.app.inject({ method: 'GET', url: '/api/v1/devices', headers: authHeader(me.accessToken) });
    expect(devices.statusCode).toBe(200);
    expect(devices.json().length).toBeGreaterThan(0);
    const deviceId = devices.json()[0].id;

    const sessionRes = await context.app.inject({ method: 'POST', url: '/api/v1/sessions', headers: authHeader(me.accessToken), payload: { deviceId } });
    expect(sessionRes.statusCode).toBe(200);
    const session = sessionRes.json();
    expect(session.status).toBe('streaming');

    const intentRes = await context.app.inject({ method: 'POST', url: `/api/v1/sessions/${session.id}/intents`, headers: authHeader(me.accessToken), payload: { label: 'Need water', confidence: 0.93 } });
    expect(intentRes.statusCode).toBe(200);

    const intents = await context.app.inject({ method: 'GET', url: `/api/v1/sessions/${session.id}/intents`, headers: authHeader(me.accessToken) });
    expect(intents.json()[0].label).toBe('Need water');

    const ended = await context.app.inject({ method: 'POST', url: `/api/v1/sessions/${session.id}/end`, headers: authHeader(me.accessToken) });
    expect(ended.statusCode).toBe(200);
    expect(ended.json()).toMatchObject({ status: 'ended', stats: { intents: 1 } });
  });
});
