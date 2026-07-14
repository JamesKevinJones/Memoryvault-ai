import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";
import { dispatchPendingEmbedJobs } from "@/features/memory/use-cases/enqueue-embed-retry";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  await ensureWorkspace(session.user.id);
  const results = await dispatchPendingEmbedJobs();

  return Response.json({
    processed: results.length,
    results,
  });
}
