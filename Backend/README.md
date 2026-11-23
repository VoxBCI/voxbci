# VoxBCI Backend

Node.js API for the VoxBCI app: auth, account data, presence (discovery map),
chats and headset telemetry.

- **Stack**: Node 24, TypeScript, Fastify 5, Zod, JSON storage (Postgres later)
- **Docs**: `http://localhost:4000/api/v1/docs` once running (generated from the Zod schemas)
- **Design**: [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## Quick start

```bash
cd Backend
npm install
cp .env.example .env      # then set JWT_SECRET
npm run dev
```

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

The server starts on **http://localhost:4000**. Data lives in `Backend/data/*.json`
(gitignored) — delete the folder to reset.

Seed four demo conversations for the app's Chats tab (the API must be running):

```bash
npm run seed:demo
```

## Connect the app

The Expo client talks to `http://localhost:4000` by default — no frontend config needed.

```bash
cd Frontend
npx expo start --web --port 8081
```

`Continue with Google` currently performs a **dev login** (`demo@voxbci.app`, created on first
use) and stores the session on the device. Profile reads `GET /me`, and the Chats tab reads
`GET /chats`, falling back to the bundled demo conversations when the API is down.

Overrides live in `Frontend/.env` (see `.env.example`):

| Variable | Default | Use |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `http://localhost:4000` | point at a tunneled/LAN API |
| `EXPO_PUBLIC_DEV_EMAIL` | `demo@voxbci.app` | the seeded account to sign in as |

A physical device cannot reach `localhost`; the client derives the dev machine's LAN address
from the Expo dev-server URL, so the same `npm run dev` works on a phone on the same network.

## Try it

Sign in (dev mode — no Google credentials needed):

```bash
curl -s -X POST http://localhost:4000/api/v1/auth/dev-login \
  -H 'content-type: application/json' \
  -d '{"email":"you@example.com"}'
```

Copy `accessToken` from the response, then:

```bash
curl -s http://localhost:4000/api/v1/me -H "Authorization: Bearer $TOKEN"

curl -s -X PATCH http://localhost:4000/api/v1/me \
  -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"displayName":"Tobi W","headline":"Building VoxBCI","settings":{"theme":"dark"}}'

curl -s -X POST http://localhost:4000/api/v1/auth/refresh \
  -H 'content-type: application/json' \
  -d '{"refreshToken":"..."}'
```

## Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/healthz` | – | process up |
| GET | `/readyz` | – | store writable |
| POST | `/api/v1/auth/dev-login` | – | `{email}` → session. 404 unless `AUTH_DEV_MODE=true` |
| POST | `/api/v1/auth/google` | – | 501 until step 8 — body `{idToken}` |
| POST | `/api/v1/auth/refresh` | – | rotate; reuse revokes the whole family |
| POST | `/api/v1/auth/logout` | – | 204, revokes the refresh token |
| GET | `/api/v1/auth/me` | Bearer | current account |
| GET | `/api/v1/me` | Bearer | current account |
| PATCH | `/api/v1/me` | Bearer | profile + partial settings |
| GET | `/api/v1/users/{id}` | Bearer | public card (no email/settings) |
| GET | `/api/v1/chats` | Bearer | chat list — the shape `Frontend/src/data/chats.ts` already expects |
| POST | `/api/v1/chats` | Bearer | `{participantId}` → existing or new DM |
| GET | `/api/v1/chats/{id}/messages` | Bearer | newest first, `?before&limit` |
| POST | `/api/v1/chats/{id}/messages` | Bearer | `{text, source:'typed'\|'bci', confidence?}` |
| GET | `/api/v1/presence/nearby` | Bearer | discovery map, grid-snapped coordinates |
| GET | `/api/v1/devices` | Bearer | discoverable headsets (dummy registry) |

Next per the build order: avatar uploads (step 7), Google sign-in (8), and the
OpenAPI-generated client types (9).

### Errors

Every failure is RFC 9457 `application/problem+json`, including the request id:

```json
{
  "type": "https://voxbci.app/problems/validation-failed",
  "title": "Request validation failed",
  "status": 400,
  "detail": "email: Invalid email address",
  "code": "VALIDATION_FAILED",
  "requestId": "req-a"
}
```

| Code | Status |
|---|---|
| `VALIDATION_FAILED` | 400 |
| `UNAUTHORIZED` | 401 |
| `INVALID_REFRESH_TOKEN` / `REFRESH_TOKEN_EXPIRED` / `REFRESH_TOKEN_REUSED` | 401 |
| `FORBIDDEN` | 403 |
| `NOT_FOUND` | 404 |
| `USERNAME_TAKEN` | 409 |
| `GOOGLE_AUTH_NOT_CONFIGURED` | 501 |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | `tsx watch` — restarts on save |
| `npm run seed:demo` | create the demo account + four conversations (API must be running) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest, via `app.inject()` (no port needed) |
| `npm run build` | compile to `dist/` |
| `npm start` | run the compiled server |

## Layout

```
src/
  app.ts            buildApp(env) — plugins + routes, no listen (testable)
  server.ts         loadEnv → listen → graceful shutdown
  config/env.ts     validated environment, no silent secret defaults
  lib/              AppError, ULID ids, time helpers
  plugins/          requireAuth, problem+json error handler
  modules/          auth/ users/ presence/ chats/ telemetry/ uploads/
  store/            JsonCollection + repository interfaces + JSON impls
data/               *.json (gitignored)
scripts/            seed-demo.ts — demo account + conversations
test/               Vitest suites
```

Modules depend on `store/repositories.ts` interfaces, never on JSON files, so moving to
Postgres touches one folder.

## Auth model

- **Access token** — JWT HS256, `ACCESS_TOKEN_TTL` (15 min), verified locally.
- **Refresh token** — 32 random bytes, stored **hashed**, 30 days, rotated on every use.
  Replaying a consumed token revokes every session for that user.
- `AUTH_DEV_MODE=true` enables email-only sign-in for local work; Google ID-token
  verification replaces it behind the same guard in step 8.

## Security notes

- `JWT_SECRET` is required (min 32 chars) — boot fails rather than falling back.
- `authorization` and `cookie` headers are redacted from logs.
- Rate limits: 100 req/min globally, 20/min on auth routes.
- Public user cards never include email, settings or devices.
