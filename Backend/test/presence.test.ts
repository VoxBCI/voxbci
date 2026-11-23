import { afterEach, describe, expect, it } from 'vitest';

import { authHeader, devLogin, makeTestApp, type TestApp } from './helpers.js';

let context: TestApp | undefined;

afterEach(async () => {
  await context?.close();
  context = undefined;
});

describe('presence', () => {
  it('stores snapped location and lists nearby visible users', async () => {
    context = await makeTestApp();
    const me = await devLogin(context.app, 'me@example.com');
    const other = await devLogin(context.app, 'other@example.com');

    await context.app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: authHeader(other.accessToken),
      payload: { headline: 'Nearby' },
    });

    const put = await context.app.inject({
      method: 'PUT',
      url: '/api/v1/presence/location',
      headers: authHeader(other.accessToken),
      payload: { lat: 51.50791, lng: -0.12812, accuracyM: 12 },
    });

    expect(put.statusCode).toBe(200);
    expect(put.json().lat).not.toBe(51.50791); // snapped

    await context.app.inject({
      method: 'PATCH',
      url: '/api/v1/presence',
      headers: authHeader(other.accessToken),
      payload: { visible: true, radiusM: 5000 },
    });

    const nearby = await context.app.inject({
      method: 'GET',
      url: '/api/v1/presence/nearby?lat=51.5079&lng=-0.1281&radiusM=5000',
      headers: authHeader(me.accessToken),
    });

    expect(nearby.statusCode).toBe(200);
    const rows = nearby.json();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: other.user.id, headline: 'Nearby' });
    expect(rows[0]).not.toHaveProperty('email');
    expect(rows[0].distanceM).toBeGreaterThanOrEqual(0);
  });

  it('hides user after DELETE /presence', async () => {
    context = await makeTestApp();
    const me = await devLogin(context.app, 'me@example.com');
    const other = await devLogin(context.app, 'other@example.com');

    await context.app.inject({
      method: 'PUT',
      url: '/api/v1/presence/location',
      headers: authHeader(other.accessToken),
      payload: { lat: 51.5, lng: -0.1 },
    });
    await context.app.inject({
      method: 'PATCH',
      url: '/api/v1/presence',
      headers: authHeader(other.accessToken),
      payload: { visible: true },
    });
    await context.app.inject({
      method: 'DELETE',
      url: '/api/v1/presence',
      headers: authHeader(other.accessToken),
    });

    const nearby = await context.app.inject({
      method: 'GET',
      url: '/api/v1/presence/nearby?lat=51.5&lng=-0.1&radiusM=5000',
      headers: authHeader(me.accessToken),
    });

    expect(nearby.json()).toEqual([]);
  });
});
