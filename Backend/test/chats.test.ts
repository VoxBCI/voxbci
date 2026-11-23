import { afterEach, describe, expect, it } from 'vitest';

import { authHeader, devLogin, makeTestApp, type TestApp } from './helpers.js';

let context: TestApp | undefined;

afterEach(async () => { await context?.close(); context = undefined; });

describe('chats', () => {
  it('creates a DM, sends a message, and lists chat summaries', async () => {
    context = await makeTestApp();
    const me = await devLogin(context.app, 'me@example.com');
    const other = await devLogin(context.app, 'other@example.com');

    const created = await context.app.inject({
      method: 'POST', url: '/api/v1/chats',
      headers: authHeader(me.accessToken),
      payload: { participantId: other.user.id },
    });
    expect(created.statusCode).toBe(200);
    const chat = created.json();
    expect(chat.name).toBe('Other'); // displayName derived from email

    const sent = await context.app.inject({
      method: 'POST', url: `/api/v1/chats/${chat.id}/messages`,
      headers: authHeader(me.accessToken),
      payload: { text: 'Hello', source: 'typed' },
    });
    expect(sent.statusCode).toBe(200);

    const list = await context.app.inject({ method: 'GET', url: '/api/v1/chats', headers: authHeader(other.accessToken) });
    expect(list.statusCode).toBe(200);
    expect(list.json()[0]).toMatchObject({ id: chat.id, preview: 'Hello', unreadCount: 1 });

    const msgs = await context.app.inject({ method: 'GET', url: `/api/v1/chats/${chat.id}/messages`, headers: authHeader(other.accessToken) });
    expect(msgs.statusCode).toBe(200);
    expect(msgs.json()[0]).toMatchObject({ text: 'Hello', senderId: me.user.id });
  });
});
