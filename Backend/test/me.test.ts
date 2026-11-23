import { afterEach, describe, expect, it } from 'vitest';

import { authHeader, devLogin, makeTestApp, type TestApp } from './helpers.js';

let context: TestApp | undefined;

afterEach(async () => {
  await context?.close();
  context = undefined;
});

describe('GET /api/v1/me', () => {
  it('returns email, settings and devices for the owner', async () => {
    context = await makeTestApp();
    const session = await devLogin(context.app);

    const response = await context.app.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: authHeader(session.accessToken),
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: session.user.id,
      email: 'tobi@example.com',
      devices: [],
      settings: { theme: 'system', units: 'metric', haptics: true },
      avatarUrl: null,
      headline: null,
    });
  });
});

describe('PATCH /api/v1/me', () => {
  it('updates profile fields and merges partial settings', async () => {
    context = await makeTestApp();
    const session = await devLogin(context.app);

    const response = await context.app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: authHeader(session.accessToken),
      payload: {
        displayName: 'Tobi W',
        headline: 'BCI tinkerer',
        settings: { theme: 'dark' },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      displayName: 'Tobi W',
      headline: 'BCI tinkerer',
      // Untouched settings survive the merge.
      settings: { theme: 'dark', units: 'metric', haptics: true },
    });
  });

  it('rejects an empty patch', async () => {
    context = await makeTestApp();
    const session = await devLogin(context.app);

    const response = await context.app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: authHeader(session.accessToken),
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe('VALIDATION_FAILED');
  });

  it('rejects a username that belongs to someone else', async () => {
    context = await makeTestApp();
    const first = await devLogin(context.app, 'first@example.com');
    const second = await devLogin(context.app, 'second@example.com');

    const response = await context.app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: authHeader(second.accessToken),
      payload: { username: first.user.username },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().code).toBe('USERNAME_TAKEN');
  });

  it('normalises and accepts a new handle', async () => {
    context = await makeTestApp();
    const session = await devLogin(context.app);

    const response = await context.app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: authHeader(session.accessToken),
      payload: { username: '  Vox_Tobi  ' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().username).toBe('vox_tobi');
  });
});

describe('GET /api/v1/users/:id', () => {
  it('exposes only the public card', async () => {
    context = await makeTestApp();
    const mine = await devLogin(context.app, 'me@example.com');
    const other = await devLogin(context.app, 'other@example.com');

    await context.app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: authHeader(other.accessToken),
      payload: { headline: 'Loves sci-fi' },
    });

    const response = await context.app.inject({
      method: 'GET',
      url: `/api/v1/users/${other.user.id}`,
      headers: authHeader(mine.accessToken),
    });

    expect(response.statusCode).toBe(200);

    const card = response.json();
    expect(card).toMatchObject({ id: other.user.id, headline: 'Loves sci-fi' });
    expect(card).not.toHaveProperty('email');
    expect(card).not.toHaveProperty('settings');
    expect(card).not.toHaveProperty('devices');
  });

  it('404s for an unknown id', async () => {
    context = await makeTestApp();
    const session = await devLogin(context.app);

    const response = await context.app.inject({
      method: 'GET',
      url: '/api/v1/users/does-not-exist',
      headers: authHeader(session.accessToken),
    });

    expect(response.statusCode).toBe(404);
  });
});
