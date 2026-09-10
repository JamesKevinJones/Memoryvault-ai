# Security notes

What is enforced, where, and the operational steps that are not in code.

## Trust boundaries

| Input | Treated as | Enforced by |
|---|---|---|
| Session | Untrusted until `requireAuth` returns a context | `lib/session.ts` |
| `workspaceId` | Derived from the session, never from the request | `lib/session.ts` |
| `projectId` in a body | A claim to verify, not a fact | `features/projects/use-cases/verify-project-access.ts` |
| Stored memory content | Data, never instruction | `ai/prompts/chat.ts` (`<memory>` fencing) |
| Model output in the cold path | Untrusted, bounded | `ai/prompts/extract.ts` (caps + truncation) |
| Request `Origin` on writes | Rejected when foreign | `middleware.ts` |

## The invariant that matters

**No repository function reads or writes a tenant row without a workspace
predicate.** Messages have no workspace column of their own, so `getMessageById`
joins through the owning conversation to get one.

The one deliberate exception is the outbox sweep, which the scheduled cron must
run across every workspace. That is why `OutboxScope` is a required argument
rather than an optional filter: widening has to be written out at the call site
(`{ allWorkspaces: true }`) and cannot happen by omission.

## Authentication

`requireAuth` is a positive assertion, not `if (!session?.user?.id)`.
[GHSA-8fpg-xm3f-6cx3](https://github.com/advisories/GHSA-8fpg-xm3f-6cx3)
describes Auth.js returning a session that is populated *and* carrying an error
when configuration fails — under which an existence check fails open. The gate
rejects error-carrying sessions and requires a genuinely non-empty string id.

`trustHost` is true only on Vercel, in development, or when `AUTH_URL` pins the
origin. A non-Vercel production boot without `AUTH_URL` fails fast rather than
trusting a client-supplied `Host` header for callback URLs.

## Rate limits

Per user, per window, in Postgres (`lib/rate-limit.ts`). An in-process limiter
would give each Vercel instance its own count. The limiter **fails open** on a
counter-store error, loudly: every endpoint it guards needs the same database to
do its work, so an unreadable counter means the request was going to fail
anyway.

| Limit | Budget | Why |
|---|---|---|
| `chat` | 20/min | Two Bedrock calls plus an async extraction |
| `search` | 60/min | One embedding per request |
| `memoryWrite` | 60/min | One embedding per write |
| `ops` | 10/min | Bounded work, but touches the queue |

## Operational steps not in code

**`CRON_SECRET`** — set it in the Vercel project (min 16 chars) so the scheduled
sweep in `vercel.json` can process every workspace. Without it that door stays
closed and signed-in users can only sweep their own workspace, which is safe but
means dead-lettered embed jobs are never retried.

**Cron cadence is capped by the plan.** `vercel.json` schedules the sweep daily
(`0 3 * * *`) because Hobby rejects anything more frequent *at deploy time* —
an every-10-minutes expression fails the build outright, it does not silently
degrade. On Pro, change it to `*/10 * * * *` so the backoff ladder in
`computeNextAttemptAt` runs at the cadence it was written for. Note this only
affects the backstop: the inline `after()` dispatch still retries the common
case immediately, and a signed-in user sweeping their own workspace is on
demand.

**`CLAUDE_API_KEY`** — the `security.yml` workflow needs it as a repo secret:

```
gh secret set CLAUDE_API_KEY --repo JamesKevinJones/Memoryvault-ai
```

**Migration baseline.** `db/migrations/0000_*.sql` is a full `CREATE TABLE` set
generated from the schema. Applying it to the existing production database —
which was built with `db:push`, not migrations — will fail because the tables
already exist. Pick one:

- *Fresh database* (simplest, and the current production database is down
  anyway): `npm run db:migrate` against an empty database.
- *Adopt in place*: create `__drizzle_migrations` and insert the journal row for
  `0000` so Drizzle records it as applied without re-running the DDL, then let
  later migrations apply normally.

Only `rate_limits` is genuinely new, so an in-place adoption also needs that one
table created by hand.

## Known accepted risk

One high advisory remains: `postcss`, reachable only through Next's build
pipeline. Its fix is Next 16, a major upgrade tracked separately. CI hard-fails
on critical and reports high without blocking — see the comment in
`.github/workflows/ci.yml`.

## Before pushing

Run `/security-review` against the pending diff.
