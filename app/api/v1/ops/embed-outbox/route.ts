import { requireWorkspaceId } from "@/lib/session";
import { isTrustedCronRequest } from "@/lib/ops-auth";
import { dispatchPendingEmbedJobs } from "@/features/memory/use-cases/enqueue-embed-retry";
import type { OutboxScope } from "@/repositories/embedding-outbox";

export async function POST(req: Request) {
  // The cron caller sweeps every workspace; a signed-in user only ever sweeps
  // their own. Previously this route authenticated and then dispatched the
  // whole table, letting any user process — and exhaust the retry budget of —
  // every other tenant's embedding jobs.
  let scope: OutboxScope;

  if (isTrustedCronRequest(req)) {
    scope = { allWorkspaces: true };
  } else {
    const workspaceId = await requireWorkspaceId();
    if (!workspaceId) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    scope = { workspaceId };
  }

  const results = await dispatchPendingEmbedJobs(scope);

  return Response.json({
    processed: results.length,
    results,
  });
}
