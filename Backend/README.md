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

Next per the build order: presence (step 4), chats (5), telemetry (6), uploads (7),
Google sign-in (8).

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
  modules/          auth/  users/            ← presence, chats, telemetry next
  store/            JsonCollection + repository interfaces + JSON impls
data/               *.json (gitignored)
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
