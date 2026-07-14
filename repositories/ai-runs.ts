import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { aiRuns } from "@/db/schema";

export type CreateAiRunInput = {
  workspaceId: string;
  userId: string;
  conversationId?: string | null;
  projectId?: string | null;
  path: "hot" | "cold";
  operation: string;
  modelId?: string | null;
  latencyMs?: number | null;
  retrievalCount?: number | null;
  cacheHit?: boolean | null;
  status: string;
  error?: string | null;
};

export async function recordAiRun(input: CreateAiRunInput) {
  await db.insert(aiRuns).values({
    id: crypto.randomUUID(),
    workspaceId: input.workspaceId,
    userId: input.userId,
    conversationId: input.conversationId ?? null,
    projectId: input.projectId ?? null,
    path: input.path,
    operation: input.operation,
    modelId: input.modelId ?? null,
    latencyMs: input.latencyMs ?? null,
    retrievalCount: input.retrievalCount ?? null,
    cacheHit: input.cacheHit ?? null,
    status: input.status,
    error: input.error ?? null,
    createdAt: new Date(),
  });
}

export async function getRecentAiRunMetrics(workspaceId: string, limit = 50) {
  const rows = await db
    .select()
    .from(aiRuns)
    .where(eq(aiRuns.workspaceId, workspaceId))
    .orderBy(desc(aiRuns.createdAt))
    .limit(limit);

  const summary = await db
    .select({
      operation: aiRuns.operation,
      path: aiRuns.path,
      count: sql<number>`count(*)::int`,
      avgLatencyMs: sql<number>`coalesce(avg(${aiRuns.latencyMs}), 0)::int`,
      errorCount: sql<number>`sum(case when ${aiRuns.status} = 'error' then 1 else 0 end)::int`,
    })
    .from(aiRuns)
    .where(eq(aiRuns.workspaceId, workspaceId))
    .groupBy(aiRuns.operation, aiRuns.path);

  return { recent: rows, summary };
}
