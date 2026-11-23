import path from 'node:path';

import { JsonCollection } from './json-store.js';
import { createJsonChatsRepo, createJsonMessagesRepo } from './json/chats.js';
import { createJsonPresenceRepo } from './json/presence.js';
import { createJsonRefreshTokensRepo } from './json/refresh-tokens.js';
import { createJsonDevicesRepo, createJsonIntentsRepo, createJsonSessionsRepo, DEFAULT_DEVICES } from './json/telemetry.js';
import { createJsonUsersRepo } from './json/users.js';
import type { Store } from './repositories.js';
import type { Chat, Device, Intent, Message, Presence, RefreshToken, Session, User } from './types.js';

/**
 * Opens every collection and wires the JSON repositories.
 *
 * Called once from `buildApp()`; tests pass a temp directory, the server passes
 * `env.dataDir`.
 */
export async function createJsonStore(dataDir: string): Promise<Store> {
  const [users, refreshTokens, presence, chats, messages, devices, sessions, intents] = await Promise.all([
    JsonCollection.open<User>(dataDir, 'users'),
    JsonCollection.open<RefreshToken>(dataDir, 'refresh_tokens'),
    JsonCollection.open<Presence>(dataDir, 'presence'),
    JsonCollection.open<Chat>(dataDir, 'chats'),
    JsonCollection.open<Message>(dataDir, 'messages'),
    JsonCollection.open<Device>(dataDir, 'devices', DEFAULT_DEVICES),
    JsonCollection.open<Session>(dataDir, 'sessions'),
    JsonCollection.open<Intent>(dataDir, 'intents'),
  ]);

  return {
    users: createJsonUsersRepo(users),
    refreshTokens: createJsonRefreshTokensRepo(refreshTokens),
    presence: createJsonPresenceRepo(presence),
    chats: createJsonChatsRepo(chats),
    messages: createJsonMessagesRepo(messages),
    devices: createJsonDevicesRepo(devices),
    sessions: createJsonSessionsRepo(sessions),
    intents: createJsonIntentsRepo(intents),
    async flush() {
      await Promise.all([users, refreshTokens, presence, chats, messages, devices, sessions, intents].map((c) => c.flush()));
    },
  };
}

export type { Store } from './repositories.js';
export type { Presence, RefreshToken, User } from './types.js';

/** Where the store lives, for logs and `/readyz`. */
export function describeDataDir(dataDir: string) {
  return path.relative(process.cwd(), dataDir) || '.';
}
