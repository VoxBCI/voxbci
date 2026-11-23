import { ApiError, request, type RequestOptions } from './http';
import { clearSession, readSession, writeSession } from './session-storage';
import type { PrivateUser, SessionResponse } from './types';

/**
 * The single owner of the signed-in session.
 *
 * Screens never touch tokens: they read `useSession()` for the user and call the
 * typed endpoint helpers, which go through `authorizedRequest`. Swapping dev
 * login for Google (or Entra External ID) later changes `signIn*` below and
 * nothing else.
 */

export type SessionState = {
  /** `loading` until the stored session has been read (or ruled out). */
  status: 'loading' | 'authenticated' | 'anonymous';
  user: PrivateUser | null;
};

type StoredSession = {
  accessToken: string;
  refreshToken: string;
  user: PrivateUser;
};

const listeners = new Set<() => void>();

let state: SessionState = { status: 'loading', user: null };
let stored: StoredSession | null = null;
let hydratePromise: Promise<void> | null = null;
let refreshPromise: Promise<boolean> | null = null;

function emit(next: SessionState) {
  state = next;
  for (const listener of listeners) listener();
}

export function getSessionSnapshot(): SessionState {
  return state;
}

export function subscribeToSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function persist(session: StoredSession) {
  stored = session;
  await writeSession(JSON.stringify(session));
  emit({ status: 'authenticated', user: session.user });
}

async function forget() {
  stored = null;
  await clearSession();
  emit({ status: 'anonymous', user: null });
}

/**
 * Rotates the token pair. Concurrent callers share one request, so a screen
 * opening three endpoints at once cannot fire three refreshes and revoke itself.
 */
async function refreshTokens(): Promise<boolean> {
  if (!stored) return false;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const current = stored;
      if (!current) return false;

      try {
        const next = await request<SessionResponse>('/auth/refresh', {
          method: 'POST',
          body: { refreshToken: current.refreshToken },
        });

        await persist({
          accessToken: next.accessToken,
          refreshToken: next.refreshToken,
          user: next.user,
        });

        return true;
      } catch (error) {
        // A rejected refresh token ends the session; a network blip does not.
        if (error instanceof ApiError && error.status === 401) await forget();
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

/** Authenticated request: attaches the access token and retries once after a refresh. */
export async function authorizedRequest<T>(
  path: string,
  options: Omit<RequestOptions, 'token'> = {},
): Promise<T> {
  try {
    return await request<T>(path, { ...options, token: stored?.accessToken ?? null });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && stored) {
      const refreshed = await refreshTokens();
      if (refreshed && stored) {
        return request<T>(path, { ...options, token: stored.accessToken });
      }
    }

    throw error;
  }
}

async function hydrate(): Promise<void> {
  const raw = await readSession();
  if (!raw) {
    emit({ status: 'anonymous', user: null });
    return;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.user) {
      throw new Error('Incomplete session');
    }

    stored = {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      user: parsed.user,
    };
    emit({ status: 'authenticated', user: stored.user });
  } catch {
    await forget();
    return;
  }

  // Trust the stored user for the first paint, then confirm it in the
  // background. A network failure keeps the cached session so the app still
  // opens offline.
  try {
    const user = await authorizedRequest<PrivateUser>('/me');
    if (stored) await persist({ ...stored, user });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) await forget();
  }
}

/** Reads the stored session once; safe to call from every consumer. */
export function hydrateSession(): Promise<void> {
  hydratePromise ??= hydrate();
  return hydratePromise;
}

/**
 * Development sign-in. `POST /auth/dev-login` creates the account on first use
 * and is disabled server-side unless `AUTH_DEV_MODE=true`.
 */
export async function signInWithDevEmail(email: string): Promise<void> {
  const session = await request<SessionResponse>('/auth/dev-login', {
    method: 'POST',
    body: { email },
  });

  await persist({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: session.user,
  });
}

export async function signOut(): Promise<void> {
  const refreshToken = stored?.refreshToken;

  await forget();

  if (refreshToken) {
    // Best effort: the local session is already gone even if this fails.
    try {
      await request('/auth/logout', { method: 'POST', body: { refreshToken } });
    } catch {
      // Offline sign-out is still a sign-out.
    }
  }
}
