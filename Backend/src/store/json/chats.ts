import { newId } from '../../lib/ids.js';
import { nowIso } from '../../lib/time.js';
import type { JsonCollection } from '../json-store.js';
import type { ChatsRepo, MessagesRepo } from '../repositories.js';
import type { Chat, Message } from '../types.js';

function dmKey(a: string, b: string): string {
  return [a, b].sort().join(':');
}

export function createJsonChatsRepo(collection: JsonCollection<Chat>): ChatsRepo {
  return {
    async create(participantIds) {
      const now = nowIso();
      const chat: Chat = {
        id: newId(),
        participantIds,
        createdAt: now,
        lastMessageAt: now,
        lastMessagePreview: '',
        unread: { [participantIds[0]]: 0, [participantIds[1]]: 0 },
      };
      return collection.insert(chat);
    },

    async findById(id) {
      return collection.get(id) ?? null;
    },

    async findDm(userA, userB) {
      const key = dmKey(userA, userB);
      return (
        collection.findOne((chat) => dmKey(chat.participantIds[0], chat.participantIds[1]) === key) ??
        null
      );
    },

    async listForUser(userId) {
      return collection
        .find((chat) => chat.participantIds.includes(userId))
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
    },

    async touch(chatId, preview, at, unread) {
      return (await collection.update(chatId, { lastMessagePreview: preview, lastMessageAt: at, unread })) ?? null;
    },

    async markRead(chatId, userId) {
      const chat = collection.get(chatId);
      if (!chat) return null;
      return (await collection.update(chatId, { unread: { ...chat.unread, [userId]: 0 } })) ?? null;
    },
  };
}

export function createJsonMessagesRepo(collection: JsonCollection<Message>): MessagesRepo {
  return {
    async create(input) {
      const message: Message = {
        id: newId(),
        chatId: input.chatId,
        senderId: input.senderId,
        text: input.text,
        source: input.source,
        confidence: input.confidence ?? null,
        createdAt: nowIso(),
      };
      return collection.insert(message);
    },

    async listByChat(chatId, opts) {
      // ULIDs are lexicographically time-sortable, so id is a stable cursor.
      let rows = collection
        .find((m) => m.chatId === chatId)
        .sort((a, b) => b.id.localeCompare(a.id) * -1);

      if (opts.before) {
        rows = rows.filter((m) => m.id < opts.before!);
      }

      return rows.slice(0, opts.limit);
    },
  };
}
