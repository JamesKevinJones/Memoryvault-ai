import { after } from "next/server";
import type { OrchestratorContext } from "@/ai/orchestrator";
import { recordAiRun } from "@/repositories/ai-runs";

export type ColdExtractionJob = {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
};

export function enqueueColdExtraction(
  ctx: OrchestratorContext,
  job: ColdExtractionJob,
) {
  after(async () => {
    await recordAiRun({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      conversationId: ctx.conversationId ?? job.conversationId,
      projectId: ctx.projectId ?? null,
      path: "cold",
      operation: "extract",
      modelId: null,
      latencyMs: 0,
      retrievalCount: null,
      cacheHit: null,
      status: "enqueued",
      error: "M4 cold extraction not implemented",
    });
  });
}
