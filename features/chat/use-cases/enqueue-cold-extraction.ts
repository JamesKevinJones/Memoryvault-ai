import { after } from "next/server";
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
    } catch {
      // Errors are recorded via orchestrator timed wrappers where applicable.
    }
  });
}
