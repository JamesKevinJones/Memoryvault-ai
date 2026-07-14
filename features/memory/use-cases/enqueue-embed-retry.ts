import { after } from "next/server";
import type { EmbedOutboxOperation } from "@/db/schema/embedding-outbox";
import { embedMemoryForUser } from "@/features/memory/use-cases/embed-memory";
import { getMemoryById } from "@/repositories/memories";
import {
  claimEmbedOutboxJob,
  listClaimableEmbedOutboxJobs,
  markEmbedOutboxCompleted,
  markEmbedOutboxDiscarded,
  markEmbedOutboxFailed,
} from "@/repositories/embedding-outbox";

export const MAX_EMBED_ATTEMPTS = 5;

export function computeNextAttemptAt(attempts: number): Date {
  const delayMs = Math.min(60_000 * 2 ** Math.max(attempts - 1, 0), 30 * 60_000);
  return new Date(Date.now() + delayMs);
}

export async function processEmbedOutboxJob(jobId: string) {
  const claimed = await claimEmbedOutboxJob(jobId);
  if (!claimed || !claimed.claimToken) return { ok: false as const, reason: "claim_failed" };

  const memory = await getMemoryById(claimed.workspaceId, claimed.memoryId);
  if (!memory) {
    await markEmbedOutboxDiscarded(
      claimed.id,
      claimed.claimToken,
      "memory missing; discarding embed job",
    );
    return { ok: false as const, reason: "memory_missing" };
  }

  try {
    await embedMemoryForUser({
      workspaceId: claimed.workspaceId,
      userId: claimed.userId,
      memoryId: memory.id,
      title: memory.title,
      content: memory.content,
      projectId: memory.projectId,
    });
    await markEmbedOutboxCompleted(claimed.id, claimed.claimToken);
    return { ok: true as const };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "embedding retry failed";
    const dead = claimed.attempts >= MAX_EMBED_ATTEMPTS;
    await markEmbedOutboxFailed(claimed.id, claimed.claimToken, message, {
      dead,
      nextAttemptAt: dead ? null : computeNextAttemptAt(claimed.attempts),
    });
    return { ok: false as const, reason: dead ? "dead" : "retry_scheduled" };
  }
}

export async function dispatchPendingEmbedJobs(limit = 10) {
  const jobs = await listClaimableEmbedOutboxJobs(limit);
  const results = [];
  for (const job of jobs) {
    results.push({
      jobId: job.id,
      ...(await processEmbedOutboxJob(job.id)),
    });
  }
  return results;
}

export function scheduleEmbedOutboxDispatch() {
  after(async () => {
    await dispatchPendingEmbedJobs();
  });
}

/** Mark a freshly inserted pending event complete after a successful inline embed. */
export async function completePendingEmbedEvent(jobId: string) {
  await markEmbedOutboxCompleted(jobId);
}

export type { EmbedOutboxOperation };
