import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";
import { getRecentAiRunMetrics } from "@/repositories/ai-runs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await ensureWorkspace(session.user.id);
  const metrics = await getRecentAiRunMetrics(workspaceId);

  return Response.json({
    workspaceId,
    summary: metrics.summary,
    recent: metrics.recent.map((row) => ({
      id: row.id,
      path: row.path,
      operation: row.operation,
      modelId: row.modelId,
      latencyMs: row.latencyMs,
      retrievalCount: row.retrievalCount,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    })),
  });
}
