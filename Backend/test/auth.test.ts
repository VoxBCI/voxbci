import { afterEach, describe, expect, it } from 'vitest';

import { authHeader, devLogin, makeTestApp, type TestApp } from './helpers.js';

let context: TestApp | undefined;

afterEach(async () => {
  await context?.close();
  context = undefined;
});

describe('POST /api/v1/auth/dev-login', () => {
  it('creates the account on first sign-in and returns a session', async () => {
    context = await makeTestApp();

    const response = await context.app.inject({
      method: 'POST',
      url: '/api/v1/auth/dev-login',
      payload: { email: 'Tobi.Wolaju@Example.com' },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.tokenType).toBe('Bearer');
    expect(body.expiresIn).toBe(900);
    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.refreshToken).toEqual(expect.any(String));
    expect(body.user.email).toBe('tobi.wolaju@example.com');
    expect(body.user.username).toBe('tobi_wolaju');
    // Never leak the hash or the google subject.
    expect(body.user).not.toHaveProperty('googleSub');
  });

  it('reuses the same account for a repeated email', async () => {
    context = await makeTestApp();

    const first = await devLogin(context.app, 'amara@example.com');
    const second = await devLogin(context.app, 'AMARA@example.com');

    expect(second.user.id).toBe(first.user.id);
    expect(second.refreshToken).not.toBe(first.refreshToken);
  });

  it('rejects a malformed email with problem+json', async () => {
    context = await makeTestApp();

    const response = await context.app.inject({
      method: 'POST',
      url: '/api/v1/auth/dev-login',
      payload: { email: 'not-an-email' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.json()).toMatchObject({
      code: 'VALIDATION_FAILED',
      status: 400,
    });
  });

  it('404s when AUTH_DEV_MODE is off', async () => {
    context = await makeTestApp({ AUTH_DEV_MODE: 'false' });

    const response = await context.app.inject({
      method: 'POST',
      url: '/api/v1/auth/dev-login',
      payload: { email: 'tobi@example.com' },
    });

    expect(response.statusCode).toBe(404);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('rotates the pair and revokes the family when a used token returns', async () => {
    context = await makeTestApp();
    const session = await devLogin(context.app);

    const rotated = await context.app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: session.refreshToken },
    });

    expect(rotated.statusCode).toBe(200);

    const next = rotated.json();
    expect(next.refreshToken).not.toBe(session.refreshToken);
    expect(next.user.id).toBe(session.user.id);

    // Replaying the consumed token must not mint anything.
    const replay = await context.app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: session.refreshToken },
    });

    expect(replay.statusCode).toBe(401);
    expect(replay.json().code).toBe('REFRESH_TOKEN_REUSED');

    // …and it revokes the token that was issued in between.
    const afterReuse = await context.app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: next.refreshToken },
    });

    expect(afterReuse.statusCode).toBe(401);
  });

  it('rejects an unknown token', async () => {
    context = await makeTestApp();

    const response = await context.app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: 'nope' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe('INVALID_REFRESH_TOKEN');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns the signed-in account', async () => {
    context = await makeTestApp();
    const session = await devLogin(context.app);

    const response = await context.app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: authHeader(session.accessToken),
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: session.user.id, email: session.user.email });
  });

  it('rejects a missing or invalid token', async () => {
    context = await makeTestApp();

    const missing = await context.app.inject({ method: 'GET', url: '/api/v1/auth/me' });
    expect(missing.statusCode).toBe(401);

    const invalid = await context.app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: authHeader('not-a-jwt'),
    });
    expect(invalid.statusCode).toBe(401);
    expect(invalid.json().code).toBe('UNAUTHORIZED');
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('revokes the refresh token', async () => {
    context = await makeTestApp();
    const session = await devLogin(context.app);

    const logout = await context.app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      payload: { refreshToken: session.refreshToken },
    });

    expect(logout.statusCode).toBe(204);

    const refresh = await context.app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: session.refreshToken },
    });

    expect(refresh.statusCode).toBe(401);
    expect(refresh.json().code).toBe('REFRESH_TOKEN_REUSED');
  });
});
