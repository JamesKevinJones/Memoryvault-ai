# STATE

Last updated: 2026-09-10

## What this branch is

`security/hardening-2026-09` — a full security and vulnerability pass over the
repo, from an audit of the default branch plus `npm audit` on the lockfile.
8 commits, all verified green (lint, typecheck, 71 tests, production build),
with the CSP and cross-origin guard checked against a running dev server in a
real browser.

Findings and reasoning: [SECURITY.md](SECURITY.md).
Full audit report: `~/.claude/plans/https-github-com-jameskevinjones-memoryv-giggly-duckling.md`.

## What changed

| Severity | Issue | Resolution |
|---|---|---|
| Critical | `next@15.5.20` — two unauthenticated RCE advisories | → 15.5.25 |
| Critical | `next-auth@5.0.0-beta.31` — existence-based auth checks fail open (GHSA-8fpg-xm3f-6cx3) | → beta.32, plus a positive-assertion gate in `lib/session.ts` |
| High | Any signed-in user could dispatch **every** tenant's embed jobs | required `OutboxScope`; cron path behind `CRON_SECRET` |
| High | No rate limit on any Bedrock-backed endpoint | Postgres-backed per-user limiter |
| High | Prompt injection via stored memories; unbounded cold-path writes | `<memory>` fencing + caps |
| High | No security headers at all | nonce CSP + static header set in middleware |
| Medium | `projectId` accepted without ownership check | `isProjectInWorkspace` on all write paths |
| Medium | Six repository functions with no workspace predicate | all scoped |
| Medium | No CSRF/Origin check on writes | 403 on foreign Origin |
| Medium | No migrations, no CI, container ran as root, `trustHost` always on | all addressed |

Lockfile: **23 vulnerabilities (4 critical, 9 high) → 6 (0 critical, 1 high)**.
The remaining high is `postcss` inside Next's build pipeline; its fix is the
Next 16 major upgrade.

## In progress

Nothing. The branch is complete and self-consistent.

## Vercel deployments were already failing before this branch

Worth stating plainly so a red check on the PR is not misread as this
branch's doing: the base commit `9483dac` on `m0-foundations` — the tip of
the default branch, before any change here — already carries
`Vercel: failure`. `main` carries an older `Vercel: success`, which is
presumably what the live URL is still serving. That is consistent with the
demo being stale and with its `DATABASE_URL` never having been updated.

This branch did briefly add a *second*, separate failure of its own: an
every-10-minutes cron, which Hobby rejects at deploy time. That one is fixed
(139b2ed), and a cron target that only exported POST when Vercel Cron sends
GET (fd5935a).

The remaining failure could not be diagnosed from here — reading the build
log needs a Vercel account login. `npm run build` succeeds locally both
normally and under a simulated `VERCEL=1 NODE_ENV=production`, and CI's
`verify` job (lint, typecheck, 71 tests, build) is green, so it is specific
to the Vercel project's own environment or settings. To get the reason:

```
npx vercel inspect dpl_AJqG4hzb1ds6oxNtwHWQWvoap7j4 --logs
```

**The likeliest cause, and it is a two-minute check.** Vercel scopes
environment variables per environment — Production, Preview, Development —
and a PR builds as *Preview*. `db/client.ts` calls `env()` at module import,
so `next build` evaluates the schema and throws on a missing required
variable; that is exactly how this build failed locally until a `.env`
existed. If `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID` and
`AUTH_GOOGLE_SECRET` are set only for Production, then **every** preview
deployment fails at build while Production succeeds — which matches exactly
what the check history shows: `main` green, every PR/branch build red.

In the Vercel dashboard: Settings → Environment Variables, confirm each of
those four is ticked for Preview, not just Production.

Second candidate, same file: Zod `.default()` applies only to an *absent*
key, never an empty one. A Bedrock or AWS variable present-but-blank would
now fail the build where it previously fell through to a `??` default.

Worth fixing properly either way: a production build should not require
runtime secrets. Making `db/client.ts` construct its client lazily on first
query would remove this whole class of build failure. Deliberately not done
on this branch — it is a real change to import-time behaviour, and doing it
speculatively against a failure I could not observe was the wrong trade.

## Next step

**The live demo's database is down** — `/api/v1/health` returns
`{"status":"degraded","db":"down"}`, so Google sign-in cannot complete: the
callback hits `DrizzleAdapter` and `ensureWorkspace`, throws, and surfaces to
the user as an OAuth error rather than a database one.

1. Check the Railway CockroachDB service is running and its connection string
   still matches `DATABASE_URL` in the Vercel project; redeploy after changing.
2. Confirm `/api/v1/health` returns `{"status":"ok","db":"up"}`.
3. Read the migration-baseline note in [SECURITY.md](SECURITY.md) before
   running `db:migrate` against the existing database — the baseline is a full
   `CREATE TABLE` set and will fail against tables that already exist. Only
   `rate_limits` is genuinely new.
4. Set `CRON_SECRET` in Vercel so the scheduled outbox sweep can run.
5. `gh secret set CLAUDE_API_KEY --repo JamesKevinJones/Memoryvault-ai` so
   `security.yml` can run.

## Open, not done

- Next 16 upgrade, to clear the last `postcss` high and let CI's audit gate be
  promoted from advisory to blocking.
- Default branch is still `m0-foundations`, not `main`, and the two branches'
  READMEs have diverged.
- No trigram index on `memories.content`; keyword search is still a full scan.
  Left alone deliberately — CockroachDB trigram index behaviour was not
  verifiable without a live database.
