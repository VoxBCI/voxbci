import multipart from '@fastify/multipart';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { Env } from '../../config/env.js';
import { AppError, Errors } from '../../lib/errors.js';
import { createRequireAuth, getAuthUser } from '../../plugins/auth.js';
import type { Store } from '../../store/repositories.js';
import { extForMime, randomKey, type StorageAdapter } from '../../storage/local.js';
import { toPrivateUser } from '../users/schemas.js';
import { createUsersService } from '../users/service.js';

export type UploadRoutesOptions = { env: Env; store: Store; storage: StorageAdapter };

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const uploadRoutes: FastifyPluginAsyncZod<UploadRoutesOptions> = async (app, { env, store, storage }) => {
  await app.register(multipart, { limits: { fileSize: MAX_AVATAR_BYTES, files: 1 } });
  const users = createUsersService(store.users);
  const requireAuth = createRequireAuth(env);

  app.post('/me/avatar', {
    preHandler: requireAuth,
    schema: { tags: ['account'], summary: 'Upload avatar', consumes: ['multipart/form-data'], response: { 200: z.object({ avatarUrl: z.string() }) } },
  }, async (request) => {
    const { id } = getAuthUser(request);
    const file = await request.file();
    if (!file) throw new AppError({ status: 400, code: 'MISSING_FILE', message: 'Upload a file field named "file"' });
    if (!ALLOWED.has(file.mimetype)) throw new AppError({ status: 400, code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Use jpeg, png, webp, or gif' });

    const body = await file.toBuffer();
    if (body.length > MAX_AVATAR_BYTES) throw new AppError({ status: 400, code: 'FILE_TOO_LARGE', message: 'Avatar must be <= 2MB' });

    const key = randomKey(`users/${id}`, extForMime(file.mimetype));
    await storage.put(key, body, file.mimetype);
    const avatarUrl = storage.url(key);

    const current = await users.getById(id);
    // Best-effort cleanup of old local avatar.
    const oldKey = current.avatarUrl?.split('/files/')[1];
    if (oldKey) await storage.delete(decodeURIComponent(oldKey)).catch(() => {});

    await users.updateProfile(id, { avatarUrl });
    return { avatarUrl };
  });

  app.get('/files/*', {
    schema: { tags: ['storage'], summary: 'Serve local stored file', security: [] },
  }, async (request, reply) => {
    const key = (request.params as { '*': string })['*'];
    if (!key || key.includes('..')) throw Errors.notFound('File not found');
    const found = await storage.get(key);
    if (!found) throw Errors.notFound('File not found');
    return reply.type(found.contentType).header('cache-control', 'public, max-age=31536000, immutable').send(found.body);
  });
};
