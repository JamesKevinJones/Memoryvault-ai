import { requireAuth } from "@/lib/session";
import { isTrustedCronRequest } from "@/lib/ops-auth";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rate-limit";
import { dispatchPendingEmbedJobs } from "@/features/memory/use-cases/enqueue-embed-retry";
import { purgeExpiredRateLimits } from "@/repositories/rate-limits";
import type { OutboxScope } from "@/repositories/embedding-outbox";

export async function POST(req: Request) {
  // The cron caller sweeps every workspace; a signed-in user only ever sweeps
  // their own. Previously this route authenticated and then dispatched the
  // whole table, letting any user process — and exhaust the retry budget of —
  // every other tenant's embedding jobs.
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
