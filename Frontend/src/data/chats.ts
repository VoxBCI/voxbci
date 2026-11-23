import type { ImageSourcePropType } from 'react-native';

import { listChats } from '@/api/endpoints';

/**
 * Chats shown on the Chats tab.
 *
 * This is the single seam between the UI and the data source: the screen only
 * ever talks to this module, so it can swap a real endpoint in for `getChats()`
 * without changing a single component.
 */

export type ChatAvatar = string | ImageSourcePropType;

export type Chat = {
  id: string;
  /** Display name, also used for the initials placeholder. */
  name: string;
  /** Last message preview. */
  preview: string;
  /**
   * Profile picture. Dummies use bundled GitHub-style identicons; the backend
   * can send a URL string instead and nothing else has to change.
   */
  avatar?: ChatAvatar | null;
};

export const DUMMY_CHATS: Chat[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    preview: 'How are you feeling today?',
    avatar: require('../../assets/images/chat-avatars/amara.png'),
  },
  {
    id: 'liam',
    name: 'Liam Chen',
    preview: 'Let us try three short words.',
    avatar: require('../../assets/images/chat-avatars/liam.png'),
  },
  {
    id: 'sofia',
    name: 'Sofia Rossi',
    preview: 'That last sentence came through clearly.',
    avatar: require('../../assets/images/chat-avatars/sofia.png'),
  },
  {
    id: 'noah',
    name: 'Noah Patel',
    preview: 'Same time tomorrow?',
    avatar: require('../../assets/images/chat-avatars/noah.png'),
  },
];

/**
 * Resolves the chat list from the API.
 *
 * Falls back to the bundled conversations when the account has no chats yet or
 * the API is unreachable, so the tab still demos offline and before the seed
 * script has run (`npm run seed:demo` in `Backend/`).
 */
export async function getChats(): Promise<Chat[]> {
  try {
    const remote = await listChats();
    if (remote.length === 0) return DUMMY_CHATS;

    return remote.map((chat) => ({
      id: chat.id,
      name: chat.name,
      preview: chat.preview,
      avatar: chat.avatar,
    }));
  } catch {
    return DUMMY_CHATS;
  }
}
