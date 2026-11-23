import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

export interface StorageAdapter {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<{ body: Buffer; contentType: string } | null>;
  delete(key: string): Promise<void>;
  url(key: string): string;
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export function extForMime(contentType: string): string {
  return MIME_TO_EXT[contentType] ?? '.bin';
}

export function randomKey(prefix: string, ext: string): string {
  return `${prefix}/${randomBytes(16).toString('hex')}${ext}`;
}

export function createLocalStorageAdapter(rootDir: string, publicBaseUrl: string): StorageAdapter {
  const metaExt = '.meta.json';
  return {
    async put(key, body, contentType) {
      const file = path.join(rootDir, key);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, body);
      await writeFile(file + metaExt, JSON.stringify({ contentType }), 'utf8');
    },
    async get(key) {
      const file = path.join(rootDir, key);
      try {
        const [body, metaRaw] = await Promise.all([readFile(file), readFile(file + metaExt, 'utf8')]);
        const meta = JSON.parse(metaRaw) as { contentType?: string };
        return { body, contentType: meta.contentType ?? 'application/octet-stream' };
      } catch {
        return null;
      }
    },
    async delete(key) {
      const file = path.join(rootDir, key);
      await Promise.allSettled([unlink(file), unlink(file + metaExt)]);
    },
    url(key) {
      return `${publicBaseUrl.replace(/\/$/, '')}/files/${key.split('/').map(encodeURIComponent).join('/')}`;
    },
  };
}
