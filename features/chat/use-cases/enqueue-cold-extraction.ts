import { after } from "next/server";
import { describeError, logger } from "@/lib/logger";
import type { OrchestratorContext } from "@/ai/orchestrator";
import { runColdExtraction } from "@/features/chat/use-cases/run-cold-extraction";

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
    try {
      await runColdExtraction(ctx, job);
    } catch (err) {
      // The orchestrator's timed wrappers record per-operation failures in
      // ai_runs, but a throw here means the whole extraction was lost — which
      // is invisible to the user and previously invisible to us too.
      logger.error("cold extraction failed", {
        conversationId: job.conversationId,
        workspaceId: ctx.workspaceId,
        error: describeError(err),
      });
    }
  });
}
