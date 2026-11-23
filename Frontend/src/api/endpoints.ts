import { authorizedRequest } from './session';
import type { ChatSummary, Message, PrivateUser } from './types';

/**
 * Typed endpoint helpers. Every call is authenticated through the session
 * module, which also handles token refresh.
 */

export function getMe(): Promise<PrivateUser> {
  return authorizedRequest('/me');
}

export function listChats(): Promise<ChatSummary[]> {
  return authorizedRequest('/chats');
}

export function listMessages(chatId: string, options: { before?: string; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (options.before) params.set('before', options.before);
  if (options.limit) params.set('limit', String(options.limit));
  const query = params.toString();

  return authorizedRequest<Message[]>(`/chats/${chatId}/messages${query ? `?${query}` : ''}`);
}

export function sendMessage(
  chatId: string,
  text: string,
  options: { source?: 'typed' | 'bci'; confidence?: number | null } = {},
): Promise<Message> {
  return authorizedRequest(`/chats/${chatId}/messages`, {
    method: 'POST',
    body: {
      text,
      source: options.source ?? 'typed',
      confidence: options.confidence ?? null,
    },
  });
}

export function markChatRead(chatId: string): Promise<void> {
  return authorizedRequest(`/chats/${chatId}/read`, { method: 'POST' });
}
