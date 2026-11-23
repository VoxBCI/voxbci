import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { Env } from '../../config/env.js';
import { createRequireAuth, getAuthUser } from '../../plugins/auth.js';
import type { Store } from '../../store/repositories.js';
import { ChatSummarySchema, MessageSchema } from './schemas.js';
import { createChatsService } from './service.js';

export type ChatRoutesOptions = { env: Env; store: Store };

export const chatRoutes: FastifyPluginAsyncZod<ChatRoutesOptions> = async (app, { env, store }) => {
  const chats = createChatsService(store.chats, store.messages, store.users);
  const requireAuth = createRequireAuth(env);

  app.get('/chats', { preHandler: requireAuth, schema: { tags: ['chats'], summary: 'List chats for the signed-in user', response: { 200: z.array(ChatSummarySchema) } } },
    async (request) => chats.listForUser(getAuthUser(request).id));

  app.post('/chats', { preHandler: requireAuth, schema: { tags: ['chats'], summary: 'Create or get a DM', body: z.object({ participantId: z.string().min(1) }), response: { 200: ChatSummarySchema } } },
    async (request) => chats.createDm(getAuthUser(request).id, request.body.participantId));

  app.get('/chats/:id/messages', { preHandler: requireAuth, schema: { tags: ['chats'], summary: 'List messages (newest first)', params: z.object({ id: z.string() }), querystring: z.object({ before: z.string().optional(), limit: z.coerce.number().int().min(1).max(100).default(50) }), response: { 200: z.array(MessageSchema) } } },
    async (request) => chats.listMessages(request.params.id, getAuthUser(request).id, request.query));

  app.post('/chats/:id/messages', { preHandler: requireAuth, schema: { tags: ['chats'], summary: 'Send a message', params: z.object({ id: z.string() }), body: z.object({ text: z.string().trim().min(1).max(2000), source: z.enum(['typed', 'bci']).default('typed'), confidence: z.number().min(0).max(1).nullable().optional() }), response: { 200: MessageSchema } } },
    async (request) => chats.sendMessage(request.params.id, getAuthUser(request).id, request.body));

  app.post('/chats/:id/read', { preHandler: requireAuth, schema: { tags: ['chats'], summary: 'Mark chat as read', params: z.object({ id: z.string() }), response: { 204: z.null() } } },
    async (request, reply) => { await chats.markRead(request.params.id, getAuthUser(request).id); return reply.status(204).send(null); });
};
