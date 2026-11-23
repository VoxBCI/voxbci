import type {
  Chat,
  Device,
  Intent,
  Message,
  NewRefreshToken,
  NewUser,
  Presence,
  PresenceUpsert,
  RefreshToken,
  Session,
  User,
  UserPatch,
} from './types.js';

/**
 * Repository interfaces — the seam between modules and storage.
 *
 * Services depend only on these, so replacing `store/json/*` with Postgres
 * (or adding caching, or a test double) never reaches into module code.
 */

export interface UsersRepo {
  create(input: NewUser): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByGoogleSub(googleSub: string): Promise<User | null>;
  update(id: string, patch: UserPatch): Promise<User | null>;
  count(): Promise<number>;
}

export interface RefreshTokensRepo {
  create(input: NewRefreshToken): Promise<RefreshToken>;
  findByHash(tokenHash: string): Promise<RefreshToken | null>;
  revoke(id: string, revokedAt: string): Promise<void>;
  /** Used when reuse is detected: every session for the user dies at once. */
  revokeAllForUser(userId: string, revokedAt: string): Promise<number>;
  deleteExpired(nowIso: string): Promise<number>;
}

export interface PresenceRepo {
  upsert(input: PresenceUpsert): Promise<Presence>;
  getByUserId(userId: string): Promise<Presence | null>;
  /** Visible, non-expired rows whose snapped point falls inside the bbox. */
  findActiveInBox(box: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }): Promise<Presence[]>;
  setVisible(userId: string, visible: boolean, radiusM?: number): Promise<Presence | null>;
  remove(userId: string): Promise<boolean>;
  sweepExpired(nowIso: string): Promise<number>;
}

export interface ChatsRepo {
  create(participantIds: [string, string]): Promise<Chat>;
  findById(id: string): Promise<Chat | null>;
  findDm(userA: string, userB: string): Promise<Chat | null>;
  listForUser(userId: string): Promise<Chat[]>;
  touch(chatId: string, preview: string, at: string, unread: Record<string, number>): Promise<Chat | null>;
  markRead(chatId: string, userId: string): Promise<Chat | null>;
}

export interface MessagesRepo {
  create(input: Omit<Message, 'id' | 'createdAt'>): Promise<Message>;
  listByChat(chatId: string, opts: { before?: string; limit: number }): Promise<Message[]>;
}

export interface DevicesRepo {
  list(): Promise<Device[]>;
  findById(id: string): Promise<Device | null>;
  upsert(device: Device): Promise<Device>;
}

export interface SessionsRepo {
  create(input: Omit<Session, 'id' | 'startedAt' | 'endedAt' | 'status' | 'stats'>): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  listForUser(userId: string, limit: number): Promise<Session[]>;
  end(id: string, endedAt: string, stats: Session['stats']): Promise<Session | null>;
}

export interface IntentsRepo {
  create(input: Omit<Intent, 'id' | 'createdAt'>): Promise<Intent>;
  listBySession(sessionId: string, opts: { before?: string; limit: number }): Promise<Intent[]>;
}

export interface Store {
  users: UsersRepo;
  refreshTokens: RefreshTokensRepo;
  presence: PresenceRepo;
  chats: ChatsRepo;
  messages: MessagesRepo;
  devices: DevicesRepo;
  sessions: SessionsRepo;
  intents: IntentsRepo;
  /** Resolves when all pending JSON writes are on disk. */
  flush(): Promise<void>;
}
