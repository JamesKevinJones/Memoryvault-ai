# MemoryVault AI — Architecture Design Spec

**Date:** 2026-07-13  
**Status:** Approved (design sections 1–10)  
**Hackathon:** CockroachDB × AWS Agentic Memory  
**Constraint:** Design only — no implementation code in this phase

---

## Locked decisions

| Decision | Choice |
|----------|--------|
| Product framing | Hybrid — global personal memory + project-scoped memory |
| Auth | Auth.js + OAuth; users/sessions in CockroachDB |
| Projects | Single-owner only |
| Documents | Text-only in CockroachDB (no S3 MVP) |
| Memory creation | Hybrid — auto-extract + user pin/edit/delete/boost |
| Runtime shape | Next.js monolith; hot path + deferred cold path |
| Workspace | 1:1 with user (personal vault) |
| API | `/api/v1/*` (+ Auth.js at `/api/auth/[...nextauth]`) |

### Binding principles

- Memory is the product, not a chat add-on.
- Premium SaaS UI (Linear / Notion / Vercel caliber) — not a ChatGPT clone.
- Performance-first: Server Components by default; function before motion.
- Engineering: no premature optimization; no infra not required for MVP; hot path stays short; background work never delays responses.
- Measure before optimizing (`ai_runs` / ops metrics).

---

## 1. Overall system architecture

### Shape

Single Next.js 15 app (BFF + UI). CockroachDB is the system of record (relational + distributed vector index). AWS Bedrock provides embeddings and LLM. All AI calls go through a thin **AI Orchestrator**.

```
Client (feature UIs)
    → app/ Route Handlers (thin)
    → features/*/use-cases
    → AI Orchestrator  |  repositories
    → AWS Bedrock      |  CockroachDB
    → observability (timers, structured logs, ai_runs)
```

### AI Orchestrator

Single entry for: `embed`, `retrieve`, `buildPrompt`, `generate`, `extract`.  
Features never call Bedrock directly. Orchestrator is a facade — not a plugin framework.

### Hot path vs cold path

**Hot (chat):** auth → persist user message → embed → retrieve → buildPrompt → generate (stream) → persist assistant message → record `ai_runs` → enqueue cold job.  
**Cold (async):** extract → dedupe/merge → embed → upsert memories/embeddings/links/tasks → `ai_runs`. Never blocks TTFB or stream.

MVP cold execution: Next.js `after()` / fire-and-forget in the same deployable. No SQS/worker service until needed.

### Observability (MVP)

Structured logs + timers + `ai_runs` rows + auth-gated `/api/v1/ops/metrics`.  
No metrics platform or cache layer until profiling justifies them.

### Out of MVP

S3 uploads, multi-member projects, separate AI microservice.

---

## 2. Folder structure

Feature-first. `app/` is a thin routing shell.

```
app/                    # layouts, pages, thin api/v1 adapters
features/               # auth, chat, memory, projects, tasks, documents
  <feature>/ui|api|use-cases|hooks|types
components/             # design system only (customized shadcn)
ai/                     # orchestrator, bedrock adapters, prompts
repositories/           # Drizzle persistence
db/                     # schema, client, migrations
observability/          # timing, logger, simple metrics
lib/                    # auth, config, env
hooks/ types/ utils/    # cross-cutting only
docker/
```

**Rules:** No domain logic in `app/` or `lib/`. No Bedrock imports outside `ai/`. No separate `services/` or `workers/` folders until a real need appears.

---

## 3. Database ER diagram (text)

```
workspaces (1) ── (1) users
    │
    ├── projects
    │       └── conversations → messages
    ├── memories → embeddings (1:1 MVP)
    │       └── memory_links (n:n memories)
    ├── tasks
    ├── documents
    └── ai_runs

sessions → users (Auth.js; supporting)
```

**Scope:** `project_id` null = global personal; set = project-scoped.  
**Hierarchy:** Workspace → Users → Projects → Conversations → Messages → Memories → Embeddings → Memory Links → Tasks → Documents → AI Runs.

---

## 4. Database schema explanation

| Entity | Role |
|--------|------|
| workspaces | Personal vault root (1 per user) |
| users | Auth identity; 1:1 workspace |
| sessions | Auth.js session state |
| projects | Named contexts; single-owner via workspace |
| conversations / messages | Chat history (not durable memory) |
| memories | Long-lived knowledge (category, summary, importance, sources, pin) |
| embeddings | Vector + model metadata; CRDB vector index |
| memory_links | Related-memory graph |
| tasks | Actionable items; open tasks injected into prompts |
| documents | Text notes/snippets only |
| ai_runs | Hot/cold latency, retrieval counts, status |

**Indexing intent:** workspace + time for timeline; workspace + project for scope; category/importance for filters; vector index on embeddings; tasks by status; ai_runs by time.

**Rule:** Messages = history; Memories = distilled long-term knowledge.

---

## 5. API routes

```
/api/auth/[...nextauth]

/api/v1/chat
/api/v1/conversations
/api/v1/memories
/api/v1/projects
/api/v1/tasks
/api/v1/documents
/api/v1/search
/api/v1/workspace
/api/v1/me
/api/v1/ops
/api/v1/health
```

- `POST /api/v1/chat` — hot path stream; enqueue cold extraction; citations in stream metadata.
- `GET|POST /api/v1/search` — semantic memory search.
- `GET /api/v1/health` — public liveness.
- `GET /api/v1/ops/metrics` — auth-gated demo metrics.
- No public extract/embeddings admin routes in MVP.

---

## 6. AI memory pipeline

1. User message → embed  
2. Vector search (workspace ± project boost; pinned/high-importance; open tasks)  
3. Build context pack + recent turns  
4. Bedrock generate (stream) + citations  
5. Persist messages; enqueue cold job  
6. Cold: extract → dedupe → embed → upsert memories/links/tasks  

Context pack: pinned/important + top-k semantic + project memories + open tasks + short recent window.

---

## 7. User flow

1. OAuth → user + workspace → empty dashboard  
2. Dashboard = home (timeline, search, filters, detail + related)  
3. Projects = scoped vault + project chat  
4. Chat = split workspace (Conversation | Memory Context | Related | Sources | Suggested Actions)  
5. Cold path updates memory panel after chat  
6. Tasks resurface unfinished work  
7. Documents capture text knowledge  
8. Cross-session recall proves persistent memory (not chat scroll)

---

## 8. Sequence diagrams (summary)

- **Sign-in:** OAuth → session → `/me` → ensure user+workspace  
- **Hot chat:** save → embed → retrieve → prompt → stream → save → ai_runs → enqueue cold  
- **Cold:** extract → merge → embed → upsert → ai_runs → UI refresh  
- **Search:** embed → ANN retrieve → ranked memories  
- **Edit memory:** patch → re-embed if content changed  
- **Project chat:** same hot path with `projectId` scope

---

## 9. Component hierarchy

- `AppShell` → Sidebar, TopBar, PageSlot  
- `MemoryDashboardPage` → filters, search, virtualized `MemoryTimeline` → `MemoryCard` / `MemoryDetailPanel`  
- `ChatWorkspacePage` → ConversationPane + MemoryContextPane + RelatedKnowledgePane + SourcesPane + SuggestedActionsPane  
- `ProjectsPage` / `ProjectDetailPage` → scoped timeline + tasks/docs previews + chat CTA  
- `TasksPage`, `DocumentsPage`  
- `components/ui` + `layout` = customized design system only  

RSC by default; client for composer/SSE, virtualization, justified motion (150–250ms).

---

## 10. Development roadmap

| Milestone | Focus | Exit criteria |
|-----------|--------|----------------|
| M0 Foundations | Next.js, Docker, Auth, workspace, shell, health | Sign-in + empty shell |
| M1 Memory CRUD | Schema, repos, APIs, timeline UI | Create/browse/edit memories |
| M2 Orchestrator + vectors | Bedrock embed/retrieve, search, ai_runs | Semantic search works |
| M3 Chat hot path | Streaming chat, citations, cold enqueue stub | Fast chat with sources |
| M4 Cold path | Extract, upsert, tasks, panel refresh | Cross-session recall |
| M5 Projects/tasks/docs | Scoped memory + follow-ups | Project demo complete |
| M6 Polish | Motion, empty states, perf audit, demo script | Launch-quality UI |
| M7 Deploy | Docker on AWS, prod CRDB + Bedrock | Public demo URL |

Build order: M0 → M1 → M2 → M3 → M4 → M5 → M6 → M7.

---

## UI / UX (constraints)

- Memory-first IA; timeline as visual centerpiece.  
- Refined neutrals, strong typography, large spacing, soft depth; no generic chatbot layout.  
- Motion only when it aids usability; interruptible; transform/opacity; 150–250ms.  
- Targets: first load &lt; 2s; interaction &lt; 100ms feel; virtualize long lists; debounce search; optimistic mutations where safe.

---

## Spec self-review

- [x] No TBD placeholders for core decisions  
- [x] Hot/cold path consistent across §§1, 6, 8, 10  
- [x] Feature-first structure aligns with Orchestrator + repositories  
- [x] Workspace 1:1, single-owner projects, text-only docs, hybrid memory creation reflected throughout  
- [x] Scope bounded for hackathon MVP (no S3, no multi-member, no separate worker)

---

## Next step

User reviews this spec. On approval, produce an implementation plan (starting at M0) via the writing-plans workflow — still incremental, no big-bang codegen.
