import { requireAuth } from "@/lib/session";
import { isTrustedCronRequest } from "@/lib/ops-auth";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rate-limit";
import { dispatchPendingEmbedJobs } from "@/features/memory/use-cases/enqueue-embed-retry";
import { purgeExpiredRateLimits } from "@/repositories/rate-limits";
import type { OutboxScope } from "@/repositories/embedding-outbox";

async function sweep(req: Request): Promise<Response> {
  // Two callers with very different blast radii. The cron sweeps every
  // workspace; a signed-in user only ever sweeps their own. This route used to
  // authenticate and then dispatch the whole table, letting any user process —
  // and exhaust the retry budget of — every other tenant's embedding jobs.
  const trustedCron = isTrustedCronRequest(req);
  let scope: OutboxScope;

  if (trustedCron) {
    scope = { allWorkspaces: true };
  } else {
    const ctx = await requireAuth();
    if (!ctx) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const rate = await checkRateLimit("ops", ctx.userId);
    if (!rate.allowed) return rateLimitedResponse(rate);

    scope = { workspaceId: ctx.workspaceId };
  }

  const results = await dispatchPendingEmbedJobs(scope);

  // Piggyback the counter cleanup on the scheduled sweep so expired rate-limit
  // windows don't accumulate forever.
  const purged = trustedCron ? await purgeExpiredRateLimits() : 0;

  return Response.json({
    processed: results.length,
    results,
    ...(trustedCron ? { purgedRateLimitWindows: purged } : {}),
  });
}

/**
 * Vercel Cron invokes its target with GET, so the scheduled sweep needs a GET
 * handler to exist at all — a POST-only route would have been dead on arrival
 * even once it deployed. Same gate, same scoping: without a valid CRON_SECRET
 * this is just the caller's own workspace.
 */
export async function GET(req: Request) {
  return sweep(req);
}

/** Kept for on-demand sweeps from the app. */
export async function POST(req: Request) {
  return sweep(req);
}
