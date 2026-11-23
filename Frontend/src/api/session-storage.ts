import * as SecureStore from 'expo-secure-store';

/**
 * Session persistence on native: the keychain (iOS) / encrypted preferences
 * (Android). Web uses `session-storage.web.ts` instead, so this module — and
 * `expo-secure-store` — never enters the web bundle.
 */

const KEY = 'voxbci.session.v1';

export async function readSession(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    // A corrupted or invalidated keychain entry is equivalent to no session.
    return null;
  }
}

export async function writeSession(value: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, value);
}

export async function clearSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // Nothing stored — already signed out.
  }
}
