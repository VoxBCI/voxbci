import { z } from 'zod';

export const ChatSummarySchema = z.object({
  id: z.string(),
  /** Other participant display name — matches Frontend/src/data/chats.ts */
  name: z.string(),
  preview: z.string(),
  avatar: z.string().nullable(),
  participantId: z.string(),
  unreadCount: z.number().int(),
  lastMessageAt: z.string(),
});

export const MessageSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  senderId: z.string(),
  text: z.string(),
  source: z.enum(['typed', 'bci']),
  confidence: z.number().nullable(),
  createdAt: z.string(),
});

export type ChatSummary = z.infer<typeof ChatSummarySchema>;
