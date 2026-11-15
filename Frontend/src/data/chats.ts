import type { ImageSourcePropType } from 'react-native';

/**
 * Chats shown on the Chats tab.
 *
 * This is the single seam between the UI and the data source: replace
 * `getChats()` with a backend call (e.g. `fetch('/api/chats')`) and the screen
 * keeps working, because it only ever talks to this module.
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
 * Resolves the chat list.
 *
 * Deliberately async: the UI already awaits it, so switching to a real
 * endpoint is a body change here rather than a screen rewrite.
 */
export async function getChats(): Promise<Chat[]> {
  return DUMMY_CHATS;
}
