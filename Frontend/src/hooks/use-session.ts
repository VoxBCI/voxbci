import { useEffect, useSyncExternalStore } from 'react';

import {
  getSessionSnapshot,
  hydrateSession,
  subscribeToSession,
  type SessionState,
} from '@/api/session';

/**
 * The signed-in account, backed by the API session store.
 *
 * Hydration is idempotent, so every component can use this hook without a
 * provider in the tree.
 */
export function useSession(): SessionState {
  const session = useSyncExternalStore(subscribeToSession, getSessionSnapshot, getSessionSnapshot);

  useEffect(() => {
    void hydrateSession();
  }, []);

  return session;
}
