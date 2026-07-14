# MemoryVault AI

> Persistent memory for agents — not another chatbot with a scrollback buffer.

**MemoryVault AI** is an AI product where **long-term memory is the core feature**. It stores what matters across sessions in **CockroachDB**, retrieves it with **semantic search**, and reasons with **AWS Bedrock** — so the assistant remembers preferences, projects, tasks, and facts the way a trusted teammate would.

Built for the **CockroachDB × AWS Agentic Memory Hackathon**.

**Author:** [Jameskevinjones](https://github.com/Jameskevinjones)

---

## Why this exists

Chat history is not memory. MemoryVault separates:

| Chat history | Durable memory |
|--------------|----------------|
| Ephemeral turns | Distilled facts, prefs, project context |
| Scroll to “remind” the model | Automatic retrieval into every prompt |
| Lost between sessions | Survives across days and projects |

Your vault is the product. Chat is just one way in.

---

## What’s working today

| Milestone | Status |
|-----------|--------|
| **M0 — Foundations** | ✅ Complete — Auth.js (Google), workspace 1:1, app shell, health/me/workspace APIs |
| **M1 — Memory CRUD** | ✅ Complete — schema, repos, `/api/v1/memories`, timeline dashboard (create/browse/edit/delete) |
| **M2 — Orchestrator + vectors** | Planned — Bedrock embed/retrieve, semantic search |

Architecture (locked): [docs/superpowers/specs/2026-07-13-memoryvault-ai-design.md](docs/superpowers/specs/2026-07-13-memoryvault-ai-design.md)

---

## Stack

- **Frontend:** Next.js 15 · React 19 · TypeScript · Tailwind · shadcn/ui  
- **Backend:** Route Handlers · Drizzle ORM · CockroachDB  
- **AI (upcoming):** AWS Bedrock · LangChain · thin AI Orchestrator  
- **Auth:** Auth.js + Google OAuth  

---

## Quick start

### Prerequisites

- Node.js 20+ (22.x recommended)
- npm 10+
- Docker Desktop (local CockroachDB)
- Google OAuth client (Web application)

### 1. Clone & install

```bash
git clone https://github.com/Jameskevinjones/memoryvault-ai.git
cd memoryvault-ai
npm install
```

### 2. Start CockroachDB

```bash
docker compose up -d
docker compose exec cockroach ./cockroach sql --insecure -e "CREATE DATABASE IF NOT EXISTS memoryvault;"
```

### 3. Environment

```bash
cp .env.example .env
```

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | `postgresql://root@localhost:26257/memoryvault?sslmode=disable` |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google Cloud Console |
| `AUTH_URL` | `http://localhost:3000` |

**OAuth redirect URI:** `http://localhost:3000/api/auth/callback/google`

### 4. Schema + run

```bash
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → sign in → dashboard.

### 5. Health

```bash
curl http://localhost:3000/api/v1/health
# {"status":"ok","db":"up"}
```

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm test` | Vitest |
| `npm run db:push` | Push Drizzle schema |
| `npm run db:studio` | Drizzle Studio |

---

## Project shape

Feature-first Clean Architecture: `features/*` · `repositories/` · `db/` · `ai/` (Orchestrator coming in M2) · thin `app/` shell.

APIs live under `/api/v1/*` (Auth.js at `/api/auth/[...nextauth]`).

### Memory CRUD (M1)

After sign-in, open **Dashboard** (`/dashboard`):

- **Add memory** — title, content, category, importance
- **Filter** — keyword search, category, minimum importance
- **Detail panel** — view, edit, pin, delete

API: `GET/POST /api/v1/memories`, `GET/PATCH/DELETE /api/v1/memories/:id`, `GET .../related`

---

## Picking up later

If you paused mid-milestone, start here: **[docs/CONTINUE.md](docs/CONTINUE.md)** — exact branch, last commits, and next task.

---

## License

Private / hackathon project · © Jameskevinjones
