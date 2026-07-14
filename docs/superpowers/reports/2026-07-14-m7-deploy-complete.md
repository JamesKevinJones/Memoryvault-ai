# M7 — Deploy: Complete

**Date:** 2026-07-14
**Live URL:** https://memoryvault-ai-delta.vercel.app

## What shipped

| Piece | Where | Details |
|---|---|---|
| App | Vercel (`memoryvault-ai` project) | Production deployment from local source, Next.js 15 build, all env vars set |
| Database | Railway (`memoryvault-ai` project) | CockroachDB v24.3 single-node, 500MB volume at `/cockroach/cockroach-data`, ballast disabled, memory capped (`--cache=64MiB --max-sql-memory=128MiB`) |
| DB access | Railway TCP proxy | `hayabusa.proxy.rlwy.net:40555` → 26257 (used by Vercel and for ops) |
| Schema | Applied via `drizzle-kit push` | All 15 tables created; the HNSW vector index statement is rejected by CRDB (`unrecognized access method: hnsw`) — vector column exists, index skipped |
| Code | GitHub `main` | https://github.com/JamesKevinJones/Memoryvault-ai |

## Verification

- `GET /api/v1/health` → `{"status":"ok","db":"up"}` (Vercel → Railway CRDB connectivity confirmed)
- `/sign-in` renders (HTTP 200)

## Deviations from the original M7 spec

1. **Vercel instead of Docker-on-AWS** — chosen by the author mid-deploy; no AWS account available. The Dockerfile remains in the repo for container deployment later.
2. **CockroachDB on Railway instead of CockroachDB Cloud** — single-node insecure mode behind a TCP proxy; adequate for a demo, not hardened for production.
3. **No AWS credentials** — Bedrock-backed features (chat generation, embeddings, semantic search) return errors in prod until `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` are added to Vercel project env. Everything else (auth, memory CRUD, projects, tasks, documents, dashboard) is fully functional.
4. **Vector index not created** — CockroachDB rejected drizzle's `USING hnsw` DDL. CRDB v24.3 does not support that syntax; vector search falls back to the query path in `repositories/embeddings.ts`. Revisit with CRDB's native vector indexing (v25+) or a compatible DDL.

## Manual step required (owner)

Google sign-in on prod needs the redirect URI added to the OAuth client in Google Cloud Console:

```
https://memoryvault-ai-delta.vercel.app/api/auth/callback/google
```

(APIs & Services → Credentials → the OAuth 2.0 client used for MemoryVault → Authorized redirect URIs.)

## Ops notes

- Redeploy app: `npx vercel --prod --yes` from the repo root (or connect the GitHub repo in the Vercel dashboard for auto-deploys from `main`).
- DB scripts: `scripts/prod-db-init.mjs` (create DB), `scripts/prod-db-check.mjs` (list tables) — both take the proxy URL via env var.
- Railway project: `memoryvault-ai` (id `c3bd58b2-ac20-42a3-9003-aa4c602ae929`), service `cockroachdb`.
