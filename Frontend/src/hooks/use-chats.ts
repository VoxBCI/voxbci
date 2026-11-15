import { useEffect, useState } from 'react';

import { DUMMY_CHATS, getChats, type Chat } from '@/data/chats';

/**
 * Chat list for the Chats tab.
 *
 * Seeded with the dummy store so the first paint has no spinner, then refreshed
 * through `getChats()`. Point that at the backend and nothing here changes.
 */
export function useChats(): Chat[] {
  const [chats, setChats] = useState<Chat[]>(DUMMY_CHATS);

  useEffect(() => {
    let active = true;

    getChats().then((next) => {
      if (active) setChats(next);
    });

    return () => {
      active = false;
    };
  }, []);

  return chats;
}
