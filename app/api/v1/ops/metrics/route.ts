import { requireWorkspaceId } from "@/lib/session";
import { getRecentAiRunMetrics } from "@/repositories/ai-runs";

export async function GET() {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

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
