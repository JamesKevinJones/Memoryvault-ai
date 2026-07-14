# M3 Chat Hot Path — Completion Report

**Date:** 2026-07-14  
**Branch:** `m0-foundations`  
**Status:** Complete — awaiting human review before M4

---

## 1. What was implemented

- **AI Orchestrator** — `orchestratorBuildPrompt`, `orchestratorGenerate` (Bedrock Nova Lite streaming)
- **Hot path** — persist user message → embed → retrieve → build prompt → stream → persist assistant message
- **`POST /api/v1/chat`** — SSE stream with `token`, `metadata` (citations), `done` events
- **Cold path stub** — `enqueueColdExtraction` via Next.js `after()` records `ai_runs` with status `enqueued`
- **Context pack** — semantic memories + pinned/important + open tasks + recent turns
- **Chat UI** — functional workspace with conversation pane + memory context citations panel
- **Quality gates** — 36 tests, lint, typecheck, build pass

---

## 2. Files created (high level)

| Area | Paths |
|------|--------|
| AI | `ai/prompts/chat.ts`, `ai/bedrock/generate.ts` |
| Repos | `repositories/conversations.ts`, `repositories/tasks.ts` |
| Chat feature | `features/chat/api/*`, `features/chat/use-cases/*`, `features/chat/ui/chat-workspace.tsx` |
| API | `app/api/v1/chat/route.ts` |
| Tests | `tests/chat-api.test.ts`, `tests/chat-prompt.test.ts` |
| Docs | this report |

---

## 3. Files modified (high level)

- `ai/orchestrator.ts` — implement buildPrompt + generate; extract still M4 stub
- `ai/types.ts` — chat prompt/citation types
- `repositories/memories.ts` — `listPinnedOrImportantMemories`
- `app/(app)/chat/page.tsx` — wires `ChatWorkspace`
- `tests/orchestrator.test.ts` — M3 coverage
- `.env.example` — `BEDROCK_CHAT_MODEL_ID`

---

## 4. Design decisions

| Decision | Rationale |
|----------|-----------|
| SSE (`text/event-stream`) | Simple streaming protocol; citations in `metadata` event per spec |
| Nova Lite via ConverseStream | Default chat model; same Bedrock client as embeddings |
| Cold path = `after()` + ai_run stub | Spec MVP; no worker service until M4 |
| Embed failures don't block stream prep | Same pattern as M2 memory CRUD |
| Functional chat UI only | M6 handles polish; split pane matches spec hierarchy |

---

## 5. Environment (M3 additions)

```env
BEDROCK_CHAT_MODEL_ID=amazon.nova-lite-v1:0
```

Requires Bedrock access for both Titan Embed and Nova Lite in `AWS_REGION`.

---

## 6. Quality gates

| Gate | Result |
|------|--------|
| `npm test` | ✅ 36 passed |
| `npm run lint` | ✅ |
| `npm run typecheck` | ✅ |
| `npm run build` | ✅ |

---

## 7. Manual verification

1. Docker + `npm run db:push` + AWS credentials configured
2. Sign in → add a few memories on dashboard
3. Open `/chat` → send a message related to your memories
4. Verify streamed response + citations in right panel
5. `GET /api/v1/ops/metrics` — see `embed`, `retrieve`, `generate`, and cold `extract` enqueued

---

## 8. Remaining work — M4 (next milestone)

Per locked spec — **do not start until approved:**

- `orchestratorExtractMemories` — cold path extraction
- Dedupe/merge → embed → upsert memories/links/tasks
- Memory panel refresh after chat

**Not in M4:** M6 visual polish, M5 projects UI.

---

**STOP** — Awaiting approval before M4.
