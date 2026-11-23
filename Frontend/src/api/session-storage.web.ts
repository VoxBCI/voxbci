/**
 * Session persistence on web. `expo-secure-store` has no web implementation, so
 * the token pair lives in `localStorage` during development. Guarded for SSR —
 * Expo Router serves this app with `web.output: "server"`.
 */

const KEY = 'voxbci.session.v1';

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    // Private mode / blocked storage: fall back to memory-only sessions.
    return null;
  }
}

export async function readSession(): Promise<string | null> {
  return storage()?.getItem(KEY) ?? null;
}

export async function writeSession(value: string): Promise<void> {
  storage()?.setItem(KEY, value);
}

export async function clearSession(): Promise<void> {
  storage()?.removeItem(KEY);
}
