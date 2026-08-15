# MemoryVault AI

> Persistent memory for agents — not another chatbot with a scrollback buffer.

**MemoryVault AI** is an AI product where **long-term memory is the core feature**. It stores what matters across sessions in **CockroachDB**, retrieves it with **semantic search**, and reasons with **AWS Bedrock** — so the assistant remembers preferences, projects, tasks, and facts the way a trusted teammate would.

Built for the **CockroachDB × AWS Agentic Memory Hackathon**.

**[→ Live demo](https://memoryvault-ai-delta.vercel.app)**

![Next.js](https://img.shields.io/badge/next.js-15-1B2632?labelColor=0B1016)
![CockroachDB](https://img.shields.io/badge/cockroachdb-distributed%20sql-1B2632?labelColor=0B1016)
![Bedrock](https://img.shields.io/badge/aws%20bedrock-titan%20%2B%20nova-1B2632?labelColor=0B1016)
![Auth.js](https://img.shields.io/badge/auth.js-google%20oauth-1B2632?labelColor=0B1016)

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

## The hot path and the cold path

The design decision the whole product rests on: **remembering is not done during
the reply.**

**Hot path** — the turn the user is waiting on. Retrieve relevant memories by
vector similarity, put them in the prompt, stream the answer, show the citations.
Nothing is written. It stays fast because it does no analysis.

**Cold path** — after the turn, asynchronously. Bedrock distils durable facts,
preferences and tasks out of the exchange, merges anything close to an existing
memory by vector similarity rather than inserting a near-duplicate, and refreshes
the panel when it lands.

Doing extraction inline would put a second model call in front of every reply and
still get it wrong, because what mattered in a conversation is often only clear
once the conversation has moved on.

## What's built

- **Memory CRUD** with a timeline dashboard — create, browse, edit, delete
- **Semantic search** over Titan embeddings, with an `ai_runs` audit trail
- **Streaming chat** with a citations panel showing which memories were used
- **Async extraction** with vector-similarity dedupe and merge
- **Projects, tasks and documents**, with retrieval scoped per project
- **Google OAuth** and a 1:1 user-to-workspace model

Architecture spec: [docs/superpowers/specs/2026-07-13-memoryvault-ai-design.md](docs/superpowers/specs/2026-07-13-memoryvault-ai-design.md)

---

## Stack

- **Frontend:** Next.js 15 · React 19 · TypeScript · Tailwind · shadcn/ui  
- **Backend:** Route Handlers · Drizzle ORM · CockroachDB  
- **AI:** AWS Bedrock (Titan embeddings) · thin AI Orchestrator
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
git clone https://github.com/JamesKevinJones/Memoryvault-ai.git
cd Memoryvault-ai
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
| `AWS_REGION` | e.g. `us-east-1` (Bedrock region) |
| `BEDROCK_EMBED_MODEL_ID` | Default `amazon.titan-embed-text-v2:0` |
| `BEDROCK_EMBED_DIMENSIONS` | Default `1024` |
| `BEDROCK_CHAT_MODEL_ID` | Default `amazon.nova-lite-v1:0` |

AWS credentials via the default SDK chain (env vars or `~/.aws/credentials`). Enable Titan Embed and Nova Lite in Bedrock for your region.

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

Feature-first Clean Architecture: `features/*` · `repositories/` · `db/` · `ai/` (Orchestrator) · thin `app/` shell.

APIs live under `/api/v1/*` (Auth.js at `/api/auth/[...nextauth]`).

### Memory and search

After sign-in, open **Dashboard** (`/dashboard`):

- **Add memory** — title, content, category, importance (auto-embedded via Bedrock)
- **Filter** — semantic search when typing a query; category/importance for browse mode
- **Detail panel** — view, edit, pin, delete

API: `GET/POST /api/v1/memories`, `GET/PATCH/DELETE /api/v1/memories/:id`, `GET .../related`, `GET|POST /api/v1/search`, `POST /api/v1/chat`, `GET /api/v1/ops/metrics`

### Chat

Open **Chat** (`/chat`):

- **Streamed responses** — Bedrock Nova Lite with memory retrieval
- **Citations panel** — sources from semantic + pinned memories
- **Cold path** — extraction enqueued after each turn, applied asynchronously

### Projects, tasks and documents

- **Projects** (`/projects`) — create, browse, detail with scoped memory + chat CTA
- **Tasks** (`/tasks`) — create, toggle open/done
- **Documents** (`/documents`) — create, browse, view
- **Project chat** — `/chat?projectId=…` scopes retrieval to project memories

After each chat turn:

- **Async extraction** — Bedrock distills durable memories + tasks from the conversation
- **Dedupe/merge** — similar memories merged via vector similarity
- **Panel refresh** — **Distilled from chat** updates automatically after cold path completes

---

## Elsewhere

Part of [my portfolio](https://portfolio-website-eight-kappa-iwtiz3w2ef.vercel.app),
which introduces each project by the thing it refuses to do. This one refuses to
call the scrollback buffer memory.

## License

© James Kevin Jones. Built for the CockroachDB × AWS Agentic Memory Hackathon.
