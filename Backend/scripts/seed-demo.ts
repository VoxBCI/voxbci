/**
 * Seeds the local API with a demo account and four conversations, so the Chats
 * tab shows real server data instead of the bundled fallback.
 *
 * Usage (with the API running): `npm run seed:demo`
 *
 * Idempotent: the accounts, DMs and messages are reused on every run, and a
 * conversation is only seeded when it has no messages yet.
 */

type Session = {
  accessToken: string;
  user: { id: string; displayName: string; username: string };
};

type ChatSummary = { id: string; name: string };
type Message = { id: string };

const API_URL = (process.env.API_URL ?? 'http://localhost:4000/api/v1').replace(/\/+$/, '');
const DEMO_EMAIL = process.env.SEED_EMAIL ?? 'demo@voxbci.app';

/** Display names are derived from the email prefix server-side. */
const PERSONAS = [
  { email: 'amara@voxbci.app', message: 'How are you feeling today?' },
  { email: 'liam@voxbci.app', message: 'Let us try three short words.' },
  { email: 'sofia@voxbci.app', message: 'That last sentence came through clearly.' },
  { email: 'noah@voxbci.app', message: 'Same time tomorrow?' },
] as const;

async function api<T>(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: unknown; token?: string } = {},
): Promise<T> {
  const { method = 'GET', body, token } = options;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T) : (undefined as T);

  if (!response.ok) {
    const detail = (payload as { detail?: string } | undefined)?.detail ?? response.statusText;
    throw new Error(`${method} ${path} failed (${response.status}): ${detail}`);
  }

  return payload;
}

async function main() {
  const demo = await api<Session>('/auth/dev-login', {
    method: 'POST',
    body: { email: DEMO_EMAIL },
  });

  console.log(`Signed in as ${demo.user.displayName} (@${demo.user.username})`);

  for (const persona of PERSONAS) {
    const other = await api<Session>('/auth/dev-login', {
      method: 'POST',
      body: { email: persona.email },
    });

    const chat = await api<ChatSummary>('/chats', {
      method: 'POST',
      token: other.accessToken,
      body: { participantId: demo.user.id },
    });

    const existing = await api<Message[]>(`/chats/${chat.id}/messages?limit=1`, {
      token: demo.accessToken,
    });

    if (existing.length > 0) {
      console.log(`- ${chat.name}: already has messages, skipped`);
      continue;
    }

    await api(`/chats/${chat.id}/messages`, {
      method: 'POST',
      token: other.accessToken,
      body: { text: persona.message, source: 'typed' },
    });

    console.log(`- ${chat.name}: seeded "${persona.message}"`);
  }

  console.log(`\nDone. Open the Chats tab as ${DEMO_EMAIL}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
