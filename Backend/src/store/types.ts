/** Persisted shapes. Field names are part of the API contract — keep them stable. */

export type ThemePreference = 'system' | 'light' | 'dark';
export type UnitPreference = 'metric' | 'imperial';

export type UserSettings = {
  theme: ThemePreference;
  units: UnitPreference;
  haptics: boolean;
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  units: 'metric',
  haptics: true,
};

export type User = {
  id: string;
  email: string;
  googleSub: string | null;
  displayName: string;
  /** Unique handle without the leading '@'. */
  username: string;
  /** Public URL. Uploads land here in step 7 (storage adapter). */
  avatarUrl: string | null;
  /** One line shown in the discovery-map popup. */
  headline: string | null;
  bio: string | null;
  settings: UserSettings;
  /** Paired headset ids (`VB-A1F3`, …). */
  devices: string[];
  createdAt: string;
  updatedAt: string;
};

export type NewUser = {
  email: string;
  username: string;
  displayName: string;
  googleSub?: string | null;
};

export type UserPatch = Partial<
  Pick<User, 'displayName' | 'username' | 'headline' | 'bio' | 'avatarUrl' | 'settings'>
>;

export type RefreshToken = {
  id: string;
  userId: string;
  /** sha256 of the raw token — the raw value never touches disk. */
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
  userAgent: string | null;
};

export type NewRefreshToken = {
  userId: string;
  tokenHash: string;
  expiresAt: string;
  userAgent?: string | null;
};

export type Presence = {
  /** Same as userId — one presence row per user. */
  id: string;
  userId: string;
  /** Snapped to the privacy grid before storage. */
  lat: number;
  lng: number;
  accuracyM: number | null;
  visible: boolean;
  radiusM: number;
  updatedAt: string;
  /** Presence disappears from the map after this time. */
  expiresAt: string;
};

export type PresenceUpsert = {
  userId: string;
  lat: number;
  lng: number;
  accuracyM?: number | null;
  visible?: boolean;
  radiusM?: number;
};

export type Chat = {
  id: string;
  /** Exactly two user ids for a DM. */
  participantIds: [string, string];
  createdAt: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  unread: Record<string, number>;
};

export type MessageSource = 'typed' | 'bci';

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  source: MessageSource;
  confidence: number | null;
  createdAt: string;
};

export type Device = {
  id: string;
  name: string;
  model: string;
  firmware: string;
  ownerId: string | null;
  lastSeenAt: string;
};

export type SessionStatus = 'streaming' | 'ended';

export type Session = {
  id: string;
  userId: string;
  deviceId: string;
  startedAt: string;
  endedAt: string | null;
  status: SessionStatus;
  stats: {
    intents: number;
    meanConfidence: number;
  };
};

export type Intent = {
  id: string;
  sessionId: string;
  userId: string;
  label: string;
  confidence: number;
  createdAt: string;
};
