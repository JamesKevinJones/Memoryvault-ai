# M2 Orchestrator + Vectors — Completion Report

**Date:** 2026-07-14  
**Branch:** `m0-foundations`  
**Status:** Complete — awaiting human review before M3

---

## 1. What was implemented

- **AI Orchestrator** (`ai/orchestrator.ts`) — `embed`, `retrieve`, `embedMemory`; M3/M4 stubs throw explicitly
- **AWS Bedrock embeddings** — Titan Embed Text v2 via `@aws-sdk/client-bedrock-runtime`
- **Vector schema** — `embeddings.vector` as CockroachDB `VECTOR(1024)` with HNSW cosine index
- **Repositories** — `repositories/embeddings.ts`, `repositories/ai-runs.ts`
- **`/api/v1/search`** — GET + POST semantic search (embed query → ANN retrieve)
- **`/api/v1/ops/metrics`** — auth-gated `ai_runs` summary + recent rows
- **Memory embedding on create/update** — title/content changes trigger Bedrock embed + upsert
- **Dashboard semantic search** — search box uses `/api/v1/search` when query present (list API for browse-only)
- **Quality gates** — 29 tests, lint, typecheck, build pass

---

## 2. Files created (high level)

| Area | Paths |
|------|--------|
| AI layer | `ai/config.ts`, `ai/types.ts`, `ai/bedrock/embeddings.ts`, `ai/orchestrator.ts` |
| Schema | `db/schema/embeddings.ts` |
| Repos | `repositories/embeddings.ts`, `repositories/ai-runs.ts` |
| Search feature | `features/search/use-cases/semantic-search.ts`, `features/search/api/search-handlers.ts` |
| Memory embed | `features/memory/use-cases/embed-memory.ts` |
| API routes | `app/api/v1/search/route.ts`, `app/api/v1/ops/metrics/route.ts` |
| Tests | `tests/search-api.test.ts`, `tests/orchestrator.test.ts` |
| Docs | this report |

---

## 3. Files modified (high level)

- `db/schema/memories.ts` — embeddings table moved to dedicated schema file
- `db/schema/index.ts` — export embeddings
- `features/memory/api/memory-handlers.ts` — embed on create; re-embed on title/content update
- `features/memory/ui/memory-timeline.tsx` — semantic search when `q` is set
- `package.json` — `@aws-sdk/client-bedrock-runtime`
- `.env.example` — `AWS_REGION`, `BEDROCK_EMBED_MODEL_ID`, `BEDROCK_EMBED_DIMENSIONS`

---

## 4. Design decisions

| Decision | Rationale |
|----------|-----------|
| Titan Embed v2, 1024 dims | Default Bedrock embed model; matches CRDB vector column |
| HNSW `vector_cosine_ops` | Spec indexing intent; cosine distance via Drizzle |
| Embed failures don't block CRUD | Memory saved; error recorded in `ai_runs`; search may lag until retry |
| Orchestrator records every AI op | M2 observability via `ai_runs` without separate tracing stack |
| M3/M4 methods throw | Thin orchestrator entry point locked; no premature chat/extract code |
| JWT sessions unchanged | M1 auth fix retained; no Edge DB access needed |

---

## 5. Environment (M2 additions)

```env
AWS_REGION=us-east-1
BEDROCK_EMBED_MODEL_ID=amazon.titan-embed-text-v2:0
BEDROCK_EMBED_DIMENSIONS=1024
```

AWS credentials via default SDK chain (env vars, `~/.aws/credentials`, or IAM role). Bedrock model access must be enabled in the target region.

After pulling, run `npm run db:push` when CockroachDB is up to apply the vector column migration.

---

## 6. Quality gates

| Gate | Result |
|------|--------|
| `npm test` | ✅ 29 passed |
| `npm run lint` | ✅ |
| `npm run typecheck` | ✅ |
| `npm run build` | ✅ |

`db:push` not run in CI — requires local Docker/CockroachDB.

---

## 7. Manual verification

1. Start Docker + `npm run db:push`
2. Configure AWS credentials with Bedrock embed access
3. Sign in → create a memory → check `embeddings` row exists
4. Search dashboard for related terms (semantic, not just keyword match)
5. `GET /api/v1/ops/metrics` — see `embed` / `retrieve` runs

---

## 8. Remaining work — M3 (next milestone)

Per locked spec — **do not start until approved:**

- Chat hot path — streaming `/api/v1/chat`
- `orchestratorBuildPrompt`, `orchestratorGenerate`
- Citations in stream metadata
- Cold path enqueue stub

**Not in M3:** full cold extraction (M4), M6 visual polish.

---

**STOP** — Awaiting approval before M3.
