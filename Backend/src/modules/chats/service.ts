import { AppError, Errors } from '../../lib/errors.js';
import type { ChatsRepo, MessagesRepo, UsersRepo } from '../../store/repositories.js';
import type { ChatSummary } from './schemas.js';

export function createChatsService(chats: ChatsRepo, messages: MessagesRepo, users: UsersRepo) {
  async function summarize(chatId: string, userId: string): Promise<ChatSummary> {
    const chat = await chats.findById(chatId);
    if (!chat || !chat.participantIds.includes(userId)) throw Errors.notFound('Chat not found');

    const otherId = chat.participantIds.find((id) => id !== userId)!;
    const other = await users.findById(otherId);

    return {
      id: chat.id,
      name: other?.displayName ?? 'Unknown user',
      preview: chat.lastMessagePreview,
      avatar: other?.avatarUrl ?? null,
      participantId: otherId,
      unreadCount: chat.unread[userId] ?? 0,
      lastMessageAt: chat.lastMessageAt,
    };
  }

  async function listForUser(userId: string): Promise<ChatSummary[]> {
    const rows = await chats.listForUser(userId);
    return Promise.all(rows.map((chat) => summarize(chat.id, userId)));
  }

  async function createDm(userId: string, participantId: string): Promise<ChatSummary> {
    if (userId === participantId) throw new AppError({ status: 400, code: 'INVALID_PARTICIPANT', message: 'Cannot chat with yourself' });
    const other = await users.findById(participantId);
    if (!other) throw Errors.notFound('User not found');

    const existing = await chats.findDm(userId, participantId);
    const chat = existing ?? (await chats.create([userId, participantId]));
    return summarize(chat.id, userId);
  }

  async function assertMember(chatId: string, userId: string) {
    const chat = await chats.findById(chatId);
    if (!chat || !chat.participantIds.includes(userId)) throw Errors.notFound('Chat not found');
    return chat;
  }

  async function listMessages(chatId: string, userId: string, opts: { before?: string; limit: number }) {
    await assertMember(chatId, userId);
    return messages.listByChat(chatId, opts);
  }

  async function sendMessage(chatId: string, userId: string, input: { text: string; source: 'typed' | 'bci'; confidence?: number | null }) {
    const chat = await assertMember(chatId, userId);
    const message = await messages.create({ chatId, senderId: userId, text: input.text, source: input.source, confidence: input.confidence ?? null });

    const unread = { ...chat.unread };
    for (const pid of chat.participantIds) {
      unread[pid] = pid === userId ? 0 : (unread[pid] ?? 0) + 1;
    }
    await chats.touch(chatId, input.text.slice(0, 120), message.createdAt, unread);
    return message;
  }

  async function markRead(chatId: string, userId: string) {
    await assertMember(chatId, userId);
    await chats.markRead(chatId, userId);
  }

  return { listForUser, createDm, listMessages, sendMessage, markRead };
}
