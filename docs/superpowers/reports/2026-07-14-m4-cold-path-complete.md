# M4 Cold Path — Completion Report

**Date:** 2026-07-14  
**Branch:** `m0-foundations`  
**Status:** Complete — awaiting human review before M5

---

## 1. What was implemented

- **`orchestratorExtractMemories`** — Bedrock Nova extracts memories + tasks as JSON from chat turns
- **Cold path execution** — `runColdExtraction` via `after()` replaces M3 stub
- **Dedupe/merge** — vector similarity (≥0.85) merges into existing memories; otherwise creates new
- **Upsert pipeline** — embed → memory create/update → embeddings → memory links → tasks
- **Source tracking** — `sourceConversationId` / `sourceMessageId` on extracted memories
- **Memory panel refresh** — chat UI polls `/api/v1/memories?sourceConversationId=…` after each turn
- **Quality gates** — 40 tests, lint, typecheck, build pass

---

## 2. Files created (high level)

| Area | Paths |
|------|--------|
| AI | `ai/prompts/extract.ts` |
| Chat feature | `features/chat/use-cases/run-cold-extraction.ts` |
| Tests | `tests/extract-prompt.test.ts`, `tests/cold-extraction.test.ts` |
| Docs | this report |

---

## 3. Files modified (high level)

- `ai/orchestrator.ts` — `orchestratorExtractMemories`; cold-path embed support
- `ai/bedrock/generate.ts` — `invokeConverse` for non-streaming extraction
- `ai/types.ts` — extraction result types
- `features/chat/use-cases/enqueue-cold-extraction.ts` — runs real cold path
- `features/chat/ui/chat-workspace.tsx` — distilled memories panel + polling
- `repositories/memories.ts` — source fields, `sourceConversationId` filter
- `repositories/memory-links.ts` — `upsertMemoryLink`
- `repositories/tasks.ts` — `createTask`
- `repositories/conversations.ts` — `getMessageById`
- `features/memory/types.ts`, `api/memory-schemas.ts`, `api/memory-handlers.ts`

---

## 4. Design decisions

| Decision | Rationale |
|----------|-----------|
| JSON extraction via Nova Lite | Structured output without extra parsing libs |
| 0.85 cosine dedupe threshold | Merge near-duplicates; avoid vault clutter |
| Poll after stream (2s × 10) | Cold path is async; simple refresh without websockets |
| `after()` fire-and-forget | Spec MVP; no separate worker service |
| Links by extracted `relatedTitles` | Lightweight graph without full entity resolution |

---

## 5. Quality gates

| Gate | Result |
|------|--------|
| `npm test` | ✅ 40 passed |
| `npm run lint` | ✅ |
| `npm run typecheck` | ✅ |
| `npm run build` | ✅ |

---

## 6. Manual verification

1. Sign in → open `/chat`
2. Share a durable fact or preference in conversation
3. After response completes, watch **Distilled from chat** panel populate (~2–20s)
4. Open dashboard — extracted memory should appear in timeline
5. `GET /api/v1/ops/metrics` — cold `extract` runs with status `ok`

---

## 7. Remaining work — M5 (next milestone)

Per locked spec — **do not start until approved:**

- Projects/tasks/documents CRUD UIs
- Scoped memory + project chat
- Project demo flows

**Not in M5:** M6 visual polish.

---

**STOP** — Awaiting approval before M5.
