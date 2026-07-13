# MemoryVault AI — M1 Memory CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship manual memory create/list/detail/edit/delete against CockroachDB, with timeline dashboard UI — no AI, embeddings writes, or semantic search.

**Architecture:** Extend Drizzle schema for product entities; memory persistence via `repositories/memories.ts` + `repositories/memory-links.ts`; thin `/api/v1/memories` route adapters → `features/memory` use-cases/handlers; dashboard composed from `features/memory/ui` (RSC + client timeline island).

**Tech Stack:** Next.js 15, Drizzle, CockroachDB, Zod, Vitest, `@tanstack/react-virtual` (list virtualization only).

## Global Constraints

- Architecture doc `docs/superpowers/specs/2026-07-13-memoryvault-ai-design.md` is LOCKED — do not redesign folders, APIs, entities, or relationships.
- Implement ONLY M1. No Bedrock, Orchestrator, chat, `/api/v1/search`, cold path, Framer Motion, or project/task/document CRUD UIs.
- Prefer Server Components; client only for timeline virtualization + interactive filters/forms.
- Functionality before polish; no premature abstractions.
- Commits: `git -c user.name="kj638" -c user.email="kj638@users.noreply.github.com"` (never `git config`).
- Quality gates before done: `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`.
- Branch: `m0-foundations` (continue).

---

## File map (M1)

| Path | Responsibility |
|------|----------------|
| `db/schema/projects.ts` | projects table |
| `db/schema/conversations.ts` | conversations + messages |
| `db/schema/memories.ts` | memories, embeddings, memory_links |
| `db/schema/tasks.ts` | tasks |
| `db/schema/documents.ts` | documents |
| `db/schema/ai-runs.ts` | ai_runs |
| `db/schema/index.ts` | re-exports |
| `repositories/memories.ts` | memory CRUD |
| `repositories/memory-links.ts` | related links |
| `features/memory/types.ts` | memory DTOs / categories |
| `features/memory/use-cases/*.ts` | list/create/get/update/delete/related |
| `features/memory/api/*.ts` | request handlers |
| `app/api/v1/memories/route.ts` | GET list, POST create |
| `app/api/v1/memories/[id]/route.ts` | GET/PATCH/DELETE |
| `app/api/v1/memories/[id]/related/route.ts` | GET related |
| `features/memory/ui/*` | timeline, filters, card, detail, create form |
| `app/(app)/dashboard/page.tsx` | wire memory dashboard |
| `package.json` | add `typecheck`; add `@tanstack/react-virtual` |

---

### Task 1: Schema — product tables

**Files:**
- Create: `db/schema/projects.ts`, `conversations.ts`, `memories.ts`, `tasks.ts`, `documents.ts`, `ai-runs.ts`
- Modify: `db/schema/index.ts`

**Interfaces:**
- Produces tables matching locked ER: projects, conversations, messages, memories, embeddings, memory_links, tasks, documents, ai_runs
- `memories.projectId` nullable (global vs project)
- `embeddings.vector` as `text` nullable in M1 (vector index / writes in M2 — do not invent CRDB VECTOR ops yet)

- [ ] **Step 1: Add schema files**

`projects`: id, workspaceId FK, name, description nullable, status text default `active`, createdAt, updatedAt.

`conversations`: id, workspaceId, projectId nullable FK, title nullable, createdAt, updatedAt.

`messages`: id, conversationId FK cascade, role text, content text, createdAt.

`memories`:
- id, workspaceId, projectId nullable
- category text (preference|fact|note|task_signal|project_info)
- title text, content text, summary text nullable
- importance integer default 0 (0–100)
- pinned boolean default false
- sourceConversationId / sourceMessageId / sourceDocumentId / sourceTaskId nullable text
- archivedAt nullable timestamp
- createdAt, updatedAt, lastAccessedAt nullable

`embeddings`: id, memoryId unique FK cascade, modelId text, dimensions integer, vector text nullable, createdAt.

`memory_links`: id, fromMemoryId, toMemoryId, relationType text, strength integer default 1, unique (from, to, relationType).

`tasks`: id, workspaceId, projectId nullable, title, status default `open`, dueAt nullable, memoryId nullable, createdAt, updatedAt.

`documents`: id, workspaceId, projectId nullable, title, body text, createdAt, updatedAt.

`ai_runs`: id, workspaceId, userId, conversationId nullable, projectId nullable, path text (hot|cold), operation text, modelId nullable, latencyMs integer nullable, retrievalCount integer nullable, cacheHit boolean nullable, status text, error text nullable, createdAt.

Indexes via `drizzle` table second arg where practical: memories (workspaceId + createdAt), (workspaceId + projectId), (workspaceId + category).

- [ ] **Step 2: Export from `db/schema/index.ts`**

- [ ] **Step 3: `npm run db:push` if DB up; else note DONE_WITH_CONCERNS — schema still commits**

- [ ] **Step 4: Commit** `feat: add M1 product schema (memories, projects, related entities)`

---

### Task 2: Memory repositories

**Files:**
- Create: `repositories/memories.ts`, `repositories/memory-links.ts`
- Create: `features/memory/types.ts`
- Test: `tests/memories-repository.test.ts` (unit with mocked db OR pure query-builder helpers — prefer testing filter/sort helpers if DB down)

**Interfaces:**
```ts
// features/memory/types.ts
export const MEMORY_CATEGORIES = [
  "preference", "fact", "note", "task_signal", "project_info",
] as const;
export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

export type MemoryListFilters = {
  workspaceId: string;
  projectId?: string | null; // undefined = any; null = global only
  category?: MemoryCategory;
  minImportance?: number;
  pinned?: boolean;
  q?: string; // keyword ILIKE title/content — NOT semantic
  cursor?: string; // createdAt ISO for keyset
  limit?: number;
};

export type CreateMemoryInput = {
  workspaceId: string;
  projectId?: string | null;
  category: MemoryCategory;
  title: string;
  content: string;
  summary?: string | null;
  importance?: number;
  pinned?: boolean;
};

export type UpdateMemoryInput = Partial<{
  title: string;
  content: string;
  summary: string | null;
  category: MemoryCategory;
  importance: number;
  pinned: boolean;
  projectId: string | null;
  archivedAt: Date | null;
}>;
```

```ts
// repositories/memories.ts
listMemories(filters): Promise<{ items: Memory[]; nextCursor: string | null }>
getMemoryById(workspaceId, id): Promise<Memory | null>
createMemory(input): Promise<Memory>
updateMemory(workspaceId, id, patch): Promise<Memory | null>
deleteMemory(workspaceId, id): Promise<boolean>
```

```ts
// repositories/memory-links.ts
listRelated(workspaceId, memoryId): Promise<Memory[]>
```

Always scope by `workspaceId`. Soft-archive: list excludes `archivedAt IS NOT NULL` by default.

- [ ] **Step 1: Types + repository implementations**
- [ ] **Step 2: Focused tests for filters (q/category/importance)**
- [ ] **Step 3: Commit** `feat: add memory and memory-link repositories`

---

### Task 3: Memory use-cases + `/api/v1/memories` routes

**Files:**
- Create: `features/memory/use-cases/*.ts`, `features/memory/api/memory-handlers.ts`
- Create: `app/api/v1/memories/route.ts`, `[id]/route.ts`, `[id]/related/route.ts`
- Test: `tests/memories-api.test.ts` (handler-level with mocks or validation helpers)

**Contracts (locked API):**

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/api/v1/memories` | Auth; filters: projectId, category, importance, q, cursor, limit; returns `{ items, nextCursor }` |
| POST | `/api/v1/memories` | Auth; body create; 201 `{ memory }` |
| GET | `/api/v1/memories/:id` | Auth; 404 if missing/wrong workspace |
| PATCH | `/api/v1/memories/:id` | Auth; pin/edit/importance/archive |
| DELETE | `/api/v1/memories/:id` | Auth; hard delete (+ cascade embeddings/links via FK) |
| GET | `/api/v1/memories/:id/related` | Auth; via memory_links |

Resolve workspace via `ensureWorkspace(session.user.id)` like M0.

Validate with Zod. Malformed JSON → 400.

- [ ] **Step 1: Handlers + routes**
- [ ] **Step 2: Tests for validation 400 / unauthorized shape**
- [ ] **Step 3: Commit** `feat: add /api/v1/memories CRUD routes`

---

### Task 4: Memory dashboard UI

**Files:**
- Create: `features/memory/ui/memory-dashboard.tsx` (RSC shell)
- Create: `features/memory/ui/memory-filters.tsx` (client)
- Create: `features/memory/ui/memory-timeline.tsx` (client + `@tanstack/react-virtual`)
- Create: `features/memory/ui/memory-card.tsx`
- Create: `features/memory/ui/memory-detail-panel.tsx`
- Create: `features/memory/ui/create-memory-form.tsx`
- Modify: `app/(app)/dashboard/page.tsx`
- Install: `@tanstack/react-virtual`

**Behavior:**
- Dashboard loads memories server-side (initial page) for fast first paint.
- Client island: filters debounce `q` (300ms), refetch via `/api/v1/memories`, virtualize list.
- Create memory form (title, content, category, importance) → POST → refresh list.
- Select card → detail panel with edit/pin/delete.
- Empty state when no items.
- Minimal motion (none required). No Framer Motion.
- Do not implement semantic search or chat CTA as primary action — prefer “Add memory”.

- [ ] **Step 1: Install virtualizer; build UI**
- [ ] **Step 2: Wire dashboard page**
- [ ] **Step 3: `npm run build` passes**
- [ ] **Step 4: Commit** `feat: add memory timeline dashboard`

---

### Task 5: Quality gates + M1 checkpoint

**Files:**
- Modify: `package.json` — add `"typecheck": "tsc --noEmit"`
- Modify: `README.md` — short M1 section (memory CRUD howto) only

- [ ] **Step 1: Add typecheck script**
- [ ] **Step 2: Run gates**

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

All must pass. Fix failures before claiming done.

- [ ] **Step 3: Commit** `chore: M1 quality gates and README checkpoint`
- [ ] **Step 4: Stop** — write completion report for human review; do not start M2

---

## Out of scope (do not build)

- AI Orchestrator, Bedrock, embeddings population, vector index
- `/api/v1/search`, chat, conversations UI, projects/tasks/documents CRUD UIs
- `/api/v1/ops`, Framer Motion, S3

## Spec coverage

| M1 exit item | Task |
|--------------|------|
| Schema product tables | T1 |
| Repositories | T2 |
| Memory CRUD APIs | T3 |
| Timeline UI create/browse/edit | T4 |
| Quality gates | T5 |

## Execution handoff

Plan: `docs/superpowers/plans/2026-07-14-m1-memory-crud.md`

Execute with **Subagent-Driven + composer-2.5-fast** (per prior preference) unless told otherwise.
