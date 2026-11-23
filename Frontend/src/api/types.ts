/**
 * Wire shapes returned by the backend's Zod schemas
 * (`Backend/src/modules/<module>/schemas.ts`).
 *
 * Hand-written for now; `ARCHITECTURE.md` §8 swaps this for the generated
 * OpenAPI types once the API surface settles.
 */

export type UserSettings = {
  theme: 'system' | 'light' | 'dark';
  units: 'metric' | 'imperial';
  haptics: boolean;
};

export type PrivateUser = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  email: string;
  settings: UserSettings;
  devices: string[];
  createdAt: string;
  updatedAt: string;
};

export type SessionResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  /** Access-token lifetime in seconds. */
  expiresIn: number;
  user: PrivateUser;
};

/** Matches `Chat` in `Frontend/src/data/chats.ts`. */
export type ChatSummary = {
  id: string;
  name: string;
  preview: string;
  avatar: string | null;
  participantId: string;
  unreadCount: number;
  lastMessageAt: string;
};

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  source: 'typed' | 'bci';
  confidence: number | null;
  createdAt: string;
};
