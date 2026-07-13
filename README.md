# MemoryVault AI

Persistent-memory agent for the CockroachDB × AWS Agentic Memory Hackathon.

**Status:** M0 foundations complete — auth, workspace, app shell, health API.

## Prerequisites

- **Node.js** 20+ (tested with 22.x)
- **npm** 10+
- **Docker Desktop** (or Docker Engine) for local CockroachDB
- **Google Cloud OAuth credentials** (Web application type)

## Quick start

### 1. Start CockroachDB

```bash
docker compose up -d
```

CockroachDB listens on `localhost:26257` (SQL) and `localhost:8080` (Admin UI).

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Default works with Docker Compose (`postgresql://root@localhost:26257/memoryvault?sslmode=disable`) |
| `AUTH_SECRET` | Random string — generate with `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `AUTH_URL` | `http://localhost:3000` for local dev |

### 3. Google OAuth setup

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Add **Authorized redirect URI**: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Client Secret into `.env` as `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.

### 4. Push schema

```bash
npm install
npm run db:push
```

### 5. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Health check

```bash
curl http://localhost:3000/api/v1/health
```

Expected (DB up): `{"status":"ok","db":"up"}`  
Degraded (DB down): `503` with `{"status":"degraded","db":"down"}`

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm test` | Vitest unit tests |
| `npm run db:push` | Push Drizzle schema to CockroachDB |
| `npm run db:studio` | Drizzle Studio |

## M0 exit criteria

Per the [architecture spec](docs/superpowers/specs/2026-07-13-memoryvault-ai-design.md):

- [x] Next.js app scaffold with feature-first layout
- [x] Docker Compose for local CockroachDB
- [x] Auth.js + Google OAuth sign-in
- [x] User + workspace provisioning (`/api/v1/me`, `/api/v1/workspace`)
- [x] App shell (sidebar, top bar) with empty dashboard
- [x] Health endpoint with DB probe (`/api/v1/health`)

**Manual verification:** sign in → land on `/dashboard` with sidebar; authenticated calls to `/api/v1/me` and `/api/v1/workspace` return user/workspace JSON.

## Architecture

See [docs/superpowers/specs/2026-07-13-memoryvault-ai-design.md](docs/superpowers/specs/2026-07-13-memoryvault-ai-design.md) for full design. Next milestone: **M1 Memory CRUD**.
