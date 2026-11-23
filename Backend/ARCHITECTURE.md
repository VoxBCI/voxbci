# VoxBCI Backend — Architecture

Status: **scaffold through step 6 implemented** (skeleton, auth, users, presence,
chats, telemetry REST) — see `Backend/README.md`. WebSocket realtime, uploads,
Google sign-in and the generated client types remain; §13 covers the Azure target.
Scope: everything the current frontend mock data stands in for — login, account data,
chats, headset telemetry, discovery map presence, and a storage bucket that can be swapped in.

---

## 1. What the frontend actually needs

Audited from `Frontend/src` at `caf0647`.

| Screen / module | Today | Needs from backend |
|---|---|---|
| `app/auth.tsx` | "Continue with Google" jumps straight to `/telemetry` | Google sign-in, session token, `/me` |
| `app/(main)/profile.tsx` | hardcoded identicon + `@username` | profile record (name, handle, avatar URL), account + device settings |
| `app/(main)/chats.tsx` → `data/chats.ts` | `getChats()` returns `DUMMY_CHATS` | conversation list `{id,name,preview,avatar}`, messages, send |
| `app/(main)/community.tsx` → `data/people.ts` | `PEOPLE` array with `lat/lng` | nearby users with geo + visibility, search |
| `app/(main)/telemetry.tsx` | `DUMMY_HEADSETS`, `DUMMY_READINGS`, synthetic EEG | device discovery, session lifecycle, live intents, EEG stream |
| `components/avatar.tsx` | bundled PNGs or URL | avatar URL from storage |
| `components/eeg-chart.tsx` + `data/eeg.ts` | generated locally, 128 Hz × 5 ch | live samples over a streaming channel |
| `hooks/use-chats.ts` | async seam already in place | unchanged call site once `getChats()` is real |

Two seams were already built for this: `getChats()` and the `Person`/`Chat` types both
accept URL strings for avatars. Keep those shapes — the backend should adapt to the UI,
not the other way round.

---

## 2. Stack

| Concern | Choice | Why |
|---|---|---|
| Runtime | Node 24 (already installed) | LTS, native fetch/WebSocket helpers, no transpile needed for tests |
| Language | TypeScript, `strict` | same as frontend, shared types |
| HTTP | **Fastify 5** | schema-first validation, first-class TS types, `app.inject()` for tests, built-in WebSocket plugin path |
| Validation | Zod + `fastify-type-provider-zod` | one schema drives request validation *and* the OpenAPI doc the frontend can generate types from |
| Auth | Google ID-token verification → own JWT pair | works for native + web without a server-side redirect dance |
| Store (now) | JSON files behind repository interfaces | zero setup tonight, portable later |
| Store (later) | Postgres + PostGIS + Drizzle | same repository interfaces, geo queries get `ST_DWithin` |
| Storage (now) | local disk behind `StorageAdapter` | `/files/...` served by the same server |
| Storage (later) | S3-compatible bucket | one adapter swap, no route changes |
| Realtime | WebSocket (`@fastify/websocket`) | bidirectional: intents + EEG out, device acks in |
| Docs | OpenAPI at `/api/v1/docs` | always-current contract for the Expo client |
| Tests | Vitest + `app.inject()` | no port binding, fast |
| Logs | pino (Fastify default), request IDs | |

Alternative if the team prefers familiarity: Express 5. Everything else in this document is
unchanged — only `app.ts` and the plugin list differ. Fastify is the recommendation because
validation + OpenAPI + inject-based tests are the things you will use every day here.

---

## 3. Shape of the code

```
Backend/
  src/
    server.ts              boot: env → buildApp() → listen
    app.ts                 buildApp(): registers plugins + modules, no listen (testable)
    config/env.ts          zod-validated process.env, single source of config
    plugins/               auth guard, cors, rate-limit, swagger, websocket, error handler
    modules/
      auth/                routes.ts  service.ts  tokens.ts
      users/               routes.ts  service.ts  profile.ts
      presence/            routes.ts  service.ts   (map)
      chats/               routes.ts  service.ts
      telemetry/           routes.ts  service.ts  ws.ts
      uploads/             routes.ts  service.ts
    store/
      json-store.ts        atomic file IO, load-at-boot, debounced flush
      repositories.ts      UsersRepo / ChatsRepo / ... interfaces only
      json/*.ts            JSON implementations of those interfaces
    realtime/hub.ts        topic registry, subscribe/broadcast, auth on connect
    lib/                   errors.ts, ids.ts, geo.ts, time.ts, result.ts
  data/                    JSON "database" (gitignored; `data/seeds/` is committed)
  test/
  .env.example
```

**Rule:** routes never touch `store/`; services never touch `req`/`reply`; repositories never
import Fastify. That single rule is what lets JSON → Postgres happen without touching modules.

Request flow:

```
route (validate Zod) → service (rules) → repository (data) → JSON files
                            ↓
                     hub.broadcast(topic, payload)   → WebSocket clients
```

---

## 4. Data model (JSON today, tables later)

One file per collection in `Backend/data/`. All timestamps ISO-8601 UTC, IDs are ULIDs
(sortable, no collisions between devices).

```ts
// users.json
User {
  id: string
  email: string              // unique
  googleSub?: string         // unique, set after Google sign-in
  displayName: string
  username: string           // unique handle, no '@' stored
  avatarKey?: string         // storage key, NOT a URL -> URL is resolved per request
  headline?: string          // the one-liner shown in the map popup
  bio?: string
  settings: { theme: 'system'|'light'|'dark'; units: 'metric'|'imperial'; haptics: boolean }
  devices: string[]          // paired headset ids
  createdAt: string
  updatedAt: string
}

// presence.json  (one row per visible user, TTL'd)
Presence {
  userId: string             // unique
  lat: number; lng: number   // already snapped to the privacy grid
  accuracyM?: number
  visible: boolean
  radiusM: number            // how far they want to be discoverable
  updatedAt: string
  expiresAt: string           // now + 5 min; swept by a timer
}

// chats.json + messages.json
Chat { id; participantIds: [string,string]; createdAt; lastMessageAt; lastMessagePreview; unread: Record<userId, number> }
Message { id; chatId; senderId; text; source: 'typed'|'bci'; confidence?: number; createdAt }

// devices.json + sessions.json + intents.json
Device  { id: 'VB-A1F3'; name; model; firmware; ownerId? ; lastSeenAt }
Session { id; userId; deviceId; startedAt; endedAt?; status: 'streaming'|'ended';
          stats: { intents: number; meanConfidence: number } }
Intent  { id; sessionId; userId; label: string; confidence: number; createdAt }

// refresh_tokens.json
RefreshToken { id; userId; tokenHash; expiresAt; revokedAt?; userAgent?; createdAt }
```

EEG is **never persisted**. It is a live signal: broadcast only, keep the last N seconds in a
per-session ring buffer in memory if a late client needs a backfill.

---

## 5. API surface (`/api/v1`)

### Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/google` | body `{idToken}` → verifies with Google, upserts user, returns `{accessToken, refreshToken, user}` |
| POST | `/auth/dev-login` | **only when `AUTH_DEV_MODE=true`**: `{email}` → same response. Lets you exercise every endpoint tonight without Google credentials |
| POST | `/auth/refresh` | rotate refresh token (reuse detection revokes the family) |
| POST | `/auth/logout` | revoke refresh token |
| GET | `/auth/me` | the signed-in `User` (same as `GET /me`, kept for client symmetry) |

Tokens: access = JWT HS256, 15 min, `sub`/`sid`/`scopes`; refresh = opaque 32-byte secret,
stored **hashed**, 30 days, rotated on every use.

### Account
| Method | Path | Notes |
|---|---|---|
| GET | `/me` | profile + settings |
| PATCH | `/me` | `displayName`, `username`, `headline`, `bio`, `settings` |
| GET | `/users/:id` | public card for chat/map popup |
| POST | `/me/avatar` | multipart upload → `{avatarUrl}` |
| DELETE | `/me` | soft delete + presence removal |

### Presence / discovery map
| Method | Path | Notes |
|---|---|---|
| PUT | `/presence/location` | `{lat,lng,accuracyM?}` — rate-limited to 1/min/user |
| PATCH | `/presence` | `{visible, radiusM}` — the "show me on the map" switch |
| DELETE | `/presence` | go dark (logout, backgrounded, panic) |
| GET | `/presence/nearby?lat&lng&radiusM=5000&limit=50` | bbox prefilter + haversine sort, joins `users` for name/headline/avatar |

Privacy rules baked into the service, not the client:
- opt-in only (`visible=false` by default),
- coordinates **snapped to a ~150 m grid** before they are stored or returned,
- `expiresAt` 5 min — a user who stops reporting disappears from the map,
- `radiusM` is per-user consent, clamped server-side to `[500, 50000]`,
- response never includes email or exact position.

### Chats
| Method | Path | Notes |
|---|---|---|
| GET | `/chats` | shape matches `Chat` in `Frontend/src/data/chats.ts` today |
| POST | `/chats` | `{participantId}` → existing or new DM (idempotent) |
| GET | `/chats/:id/messages?before&limit=50` | newest-first, cursor paginated |
| POST | `/chats/:id/messages` | `{text, source:'typed'\|'bci', confidence?}` |
| POST | `/chats/:id/read` | clears `unread[me]` |

### Telemetry
| Method | Path | Notes |
|---|---|---|
| GET | `/devices` | discoverable headsets (dummy registry now, real BLE registry later) |
| POST | `/sessions` | `{deviceId}` → `{session}`; marks the device busy |
| POST | `/sessions/:id/end` | closes session, computes stats |
| GET | `/sessions?limit=20` | history + aggregates for the profile screen |
| GET | `/sessions/:id/intents?before&limit` | backfill for the reading list |
| WS | `/ws` | see below |

### Storage
| Method | Path | Notes |
|---|---|---|
| GET | `/files/:key` | local driver only; S3 driver returns direct URLs instead |
| POST | `/uploads/presign` | later: S3 presigned PUT for large assets |

---

## 6. Realtime contract

One authenticated socket, `wss://…/ws?token=<access>`. Subscribe by topic:

```jsonc
// client → server
{ "type": "subscribe",   "topics": ["telemetry:<sessionId>", "chat:<chatId>", "presence:bbox"] }
{ "type": "unsubscribe","topics": ["chat:<chatId>"] }
{ "type": "ping" }

// server → client
{ "type": "intent", "sessionId": "...", "data": { "id": "...", "label": "Need water", "confidence": 0.93, "createdAt": "..." } }
{ "type": "eeg",    "sessionId": "...", "channels": 5, "samplesPerChannel": 32,
  "sampleRateHz": 128, "data": [[...],[...],[...],[...],[...]] }   // 4 frames/s, dev-sized
{ "type": "message","chatId": "...", "data": { ...Message } }
{ "type": "presence","added": [ ...PublicUser ], "removed": ["userId"] }
{ "type": "error",   "code": "FORBIDDEN", "detail": "..." }
```

Why WebSocket and not SSE: devices/clients push acks and typing state back. Why not raw
binary EEG yet: 128 Hz × 5 ch = 640 floats/s per session — JSON batches are fine for a demo
and easy to debug in DevTools; switch to a binary `Float32Array` frame (documented in the same
handler) when a real headset streams.

Auth on the socket is the same JWT; a socket dies with its access token (15 min) and the
client reconnects silently after `/auth/refresh`.

---

## 7. Storage: local now, bucket later

```ts
interface StorageAdapter {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  url(key: string): string;            // absolute or /files/...
  delete(key: string): Promise<void>;
}
```

- `LocalDiskAdapter` → `Backend/data/files/<key>`, server route `GET /files/:key` with
  `Cache-Control: public, max-age=31536000, immutable` (keys are content-hashed).
- `S3Adapter` (later) → same interface; `url()` returns the bucket/CDN URL; the `/files`
  route is not registered. Selected by `STORAGE_DRIVER=local|s3`.
- Uploads stay server-side while it is just avatars: `POST /me/avatar` validates MIME, caps at
  2 MB, re-encodes to a 512×512 WebP with `sharp`, then writes `users/<id>/avatar-<hash>.webp`.
  Old avatar is deleted after the new key is committed.
- Users are stored with `avatarKey`; every response maps it through `storage.url()` so swapping
  to a CDN never invalidates client-cached URLs.

---

## 8. Cross-cutting

- **Errors**: RFC 9457 `application/problem+json` — `{type,title,status,detail,code,requestId}`.
  One `AppError` class; the error plugin maps `ZodError` → 400 with field paths.
- **Versioning**: everything under `/api/v1`; breaking changes bump the prefix.
- **CORS**: Expo web origin + `http://localhost:8081` in dev, explicit allow-list in prod.
- **Rate limits**: 100 req/min/IP globally; auth 10/min; presence writes 1/min/user.
- **Ids/timestamps**: ULID; ISO strings; never `Date` in JSON.
- **Health**: `/healthz` (process up), `/readyz` (store loaded, storage reachable).
- **Config**: `config/env.ts` refuses to boot on a missing/invalid var — no silent defaults for
  secrets.
- **Tests**: `buildApp()` + `inject()`, JSON store pointed at a temp dir. One test file per
  module covering the happy path, an auth failure, and a validation failure.
- **CI**: `typecheck`, `lint`, `test` — the same three the frontend already runs.

### Contract sharing with the client
Fastify emits OpenAPI from the Zod schemas. Two options, both cheap:
1. `openapi-typescript` → `Frontend/src/api/types.ts` (generated, committed, regenerated on change).
2. Hand-written `Frontend/src/api/client.ts` typed against those schemas.

Either way the Expo side gets one `apiFetch()` wrapper with token refresh, and the existing
seams (`getChats()`, `PEOPLE`, `DUMMY_HEADSETS`, `DUMMY_READINGS`, profile placeholders) each
becomes a hook — no screen rewrites.

---

## 9. Privacy & compliance (not optional for this product)

Intent labels are health-adjacent data about a person who cannot easily correct the record.

- **Data minimisation**: intents keep only `label`, `confidence`, `sessionId`, `createdAt`.
  No raw EEG, no audio, no free-text the user did not send.
- **Consent is a record**: `presence.visible`, `radiusM`, and any future sharing flag are stored
  with `updatedAt` so an audit can prove what was on and when.
- **Retention**: sessions/intents 90 days by default, configurable; `DELETE /me` purges
  presence + messages and tombstones the account.
- **Export**: `GET /me/export` returns the user's own JSON — cheap to add now, painful later.
- **Transport**: HTTPS/WSS only outside localhost; refresh tokens hashed at rest; access tokens
  short-lived. Field-level encryption for `headline`/`bio` is the next step once Postgres lands.

---

## 10. Migration path (design for it now, do it when JSON hurts)

| Trigger | Move | Blast radius |
|---|---|---|
| >1 writer process, >~10k records, or you need transactions | JSON → Postgres + Drizzle | `store/json/*` → `store/sql/*`, interfaces unchanged |
| Real geo search accuracy | add PostGIS, `ST_DWithin` in `PresenceRepo.nearby` | one repository method |
| Avatars > a few thousand | `STORAGE_DRIVER=s3` | one adapter + env |
| Multiple API instances | Redis pub/sub for `realtime/hub.ts` | hub implementation only |
| Push instead of poll | same `intent` payloads through APNs/FCM | new module, unchanged contract |

Because services depend on interfaces rather than files or Fastify, every row above is a
single-layer change.

---

## 11. Build order (each step ends with something the app can use)

1. **Skeleton** — `buildApp()`, env, error plugin, `/healthz`, JSON store with atomic writes.
2. **Auth** — dev login + refresh + guard, so every later route can be exercised.
3. **Users/me** — profile read/update; wire `profile.tsx`.
4. **Presence** — location upsert, nearby query with grid snapping; wire `community.tsx` to
   `useNearbyPeople()` and keep `PEOPLE` as the offline fallback.
5. **Chats** — list/messages/send; wire `getChats()` and the chat screen.
6. **Telemetry** — devices, sessions, intents REST; then the WS hub; wire `telemetry.tsx`.
7. **Uploads** — avatar upload behind `StorageAdapter`.
8. **Google sign-in** — swap `dev-login` for ID-token verification; the guard code does not move.
9. **Contract** — OpenAPI → generated client types; delete the last `DUMMY_*` arrays.

## 12. Open decisions

- Fastify vs Express (§2) — recommendation: Fastify.
- Auth tonight: dev email login only, or wire real Google client IDs now (§5).
- Presence semantics: 150 m grid + 5 min TTL acceptable, or coarser/finer?
- Do intents need to reach the chat screen ("send this intent as a message") in v1?

---

## 13. Deployment target — Microsoft Azure

**Decision: Azure, not Firebase.** This is an Imagine Cup entry: judges are Microsoft, the
Azure credits are free, and the story is coherent — one cloud, one identity model, one
monitoring plane. Firebase would add a second vendor (Google) next to Google sign-in and move
the auth/database rules outside the Fastify code the team already controls.

The three layers the app touches — auth, data, uploads — all sit behind interfaces today
(`auth/service.ts`, `store/repositories.ts`, `StorageAdapter`), so each row below is a
single-layer swap, not a rewrite.

| Concern | Local today | Azure target | Swap cost |
|---|---|---|---|
| Identity | `POST /auth/dev-login` | **Microsoft Entra External ID** (CIAM) with Google as a federated IdP; the API verifies Entra ID tokens and keeps issuing its own access/refresh pair | `auth/service.ts` + one route; the guard, refresh rotation and client stay |
| Database | `data/*.json` | **Azure Database for PostgreSQL — Flexible Server** + PostGIS + Drizzle | `store/json/*` → `store/sql/*`, interfaces unchanged |
| API hosting | `npm run dev` on :4000 | **Azure Container Apps** (scale-to-zero, custom domain, WebSocket-friendly) or App Service | Dockerfile + `az containerapp up` |
| Files | `storage/local.ts` | **Azure Blob Storage** + Front Door/CDN for avatar URLs | one `StorageAdapter` implementation + env |
| Realtime | not built yet | **Azure Web PubSub** (or SignalR Service) for intents/EEG fan-out | `realtime/hub.ts` implementation only |
| Secrets | `.env` | **Azure Key Vault** referenced by Container Apps secrets | env plumbing |
| Observability | pino to stdout | **Application Insights** (OpenTelemetry exporter) + Log Analytics | one plugin |
| CI/CD | manual | GitHub Actions → `azure/login` → build image → deploy | workflow file |

Notes that matter for the pitch:

- **Entra External ID, not B2C.** External ID is the current CIAM product; B2C is the older
  path. Google stays as a federation option, so the auth screen's single CTA can point at Entra
  and still offer "Continue with Google" — the redirect just goes through Entra.
- **Keep the app's own JWT pair.** Entra proves *who* the user is; the API still owns short-lived
  access tokens and rotating refresh tokens. That means no client rewrite and no vendor lock on
  the session model.
- **Region**: pick one (e.g. `westeurope`) for Postgres, Container Apps and Blob so latency and
  egress stay predictable during the demo.
- **Cost**: Container Apps scale-to-zero, Postgres Burstable B1ms, Blob hot tier — comfortably
  inside the Imagine Cup credit.
- **Offline demo safety**: the app must still run with the API down (`getChats()` falls back to
  `DUMMY_CHATS`). Do not let the cloud migration remove that net before the finals.

### What to do tonight (local, no Azure account needed)

1. `Backend`: `npm install && npm run dev`, then `npm run seed:demo`.
2. `Frontend`: `npx expo start --web --port 8081`.
3. Sign in with the auth CTA (dev login, `demo@voxbci.app`), then check Profile and Chats
   against real API data.
4. Leave the Firebase question closed; revisit only if a teammate needs Firestore offline
   sync for a feature the Fastify API cannot serve.
