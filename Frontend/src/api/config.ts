import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Where the VoxBCI API lives.
 *
 * Web and simulators reach the machine running `Backend` through `localhost`.
 * A physical device does not — there `localhost` is the phone — so derive the
 * dev machine's LAN address from the Expo dev server URL instead.
 */

const DEFAULT_PORT = 4000;

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/** `192.168.1.20:8081` → `192.168.1.20`; null when it would not help. */
function devHostFromExpo(): string | null {
  if (Platform.OS === 'web') return null;

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;

  return host;
}

function resolveApiOrigin(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return stripTrailingSlash(configured);

  return `http://${devHostFromExpo() ?? 'localhost'}:${DEFAULT_PORT}`;
}

export const API_ORIGIN = resolveApiOrigin();
export const API_BASE_URL = `${API_ORIGIN}/api/v1`;
