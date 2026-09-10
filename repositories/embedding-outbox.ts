import { and, asc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  embeddingOutbox,
  type EmbedOutboxOperation,
} from "@/db/schema/embedding-outbox";

export type DbExecutor = Pick<typeof db, "insert" | "update" | "select">;

/**
 * Which tenants a dispatcher may touch. Deliberately a required, explicit
 * argument rather than an optional filter: an unscoped sweep of this table is
 * only ever correct for the trusted cron path, so widening has to be written
 * out at the call site instead of happening by omission.
 */
export type OutboxScope = { workspaceId: string } | { allWorkspaces: true };

function outboxScopeCondition(scope: OutboxScope) {
  return "allWorkspaces" in scope
    ? undefined
    : eq(embeddingOutbox.workspaceId, scope.workspaceId);
}

export type EnqueueEmbedOutboxInput = {
  workspaceId: string;
  userId: string;
  memoryId: string;
  projectId?: string | null;
  title: string;
  content: string;
  operation: EmbedOutboxOperation;
  error?: string;
};

export async function supersedePendingEmbedJobsForMemory(
  workspaceId: string,
  memoryId: string,
  executor: DbExecutor = db,
) {
  const now = new Date();
  await executor
    .update(embeddingOutbox)
    .set({
      status: "dead",
      lastError: "superseded by newer embed event",
      claimToken: null,
      claimedAt: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(embeddingOutbox.memoryId, memoryId),
        eq(embeddingOutbox.workspaceId, workspaceId),
        eq(embeddingOutbox.status, "pending"),
      ),
    );
}

export async function enqueueEmbedOutboxJob(
  input: EnqueueEmbedOutboxInput,
  executor: DbExecutor = db,
) {
  const now = new Date();
  const [row] = await executor
    .insert(embeddingOutbox)
    .values({
      id: crypto.randomUUID(),
      workspaceId: input.workspaceId,
      userId: input.userId,
      memoryId: input.memoryId,
      projectId: input.projectId ?? null,
      operation: input.operation,
      title: input.title,
      content: input.content,
      status: "pending",
      attempts: 0,
      claimToken: null,
      claimedAt: null,
      nextAttemptAt: now,
      lastError: input.error?.slice(0, 500) ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return row;
}

export async function getEmbedOutboxJob(id: string, scope: OutboxScope) {
  const [row] = await db
    .select()
    .from(embeddingOutbox)
    .where(and(eq(embeddingOutbox.id, id), outboxScopeCondition(scope)))
    .limit(1);

  return row ?? null;
}

export async function listClaimableEmbedOutboxJobs(
  scope: OutboxScope,
  limit = 10,
) {
  const now = new Date();
  return db
    .select()
    .from(embeddingOutbox)
    .where(
      and(
        eq(embeddingOutbox.status, "pending"),
        or(
          isNull(embeddingOutbox.nextAttemptAt),
          lte(embeddingOutbox.nextAttemptAt, now),
        ),
        outboxScopeCondition(scope),
      ),
    )
    .orderBy(asc(embeddingOutbox.nextAttemptAt), asc(embeddingOutbox.createdAt))
    .limit(limit);
}

/** Atomically claim a pending job for processing. Returns null if claim fails. */
export async function claimEmbedOutboxJob(id: string, scope: OutboxScope) {
  const claimToken = crypto.randomUUID();
  const now = new Date();
  const [row] = await db
    .update(embeddingOutbox)
    .set({
      status: "processing",
      claimToken,
      claimedAt: now,
      attempts: sql`${embeddingOutbox.attempts} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(embeddingOutbox.id, id),
        eq(embeddingOutbox.status, "pending"),
        or(
          isNull(embeddingOutbox.nextAttemptAt),
          lte(embeddingOutbox.nextAttemptAt, now),
        ),
        outboxScopeCondition(scope),
      ),
    )
    .returning();

  return row ?? null;
}

export async function markEmbedOutboxCompleted(
  id: string,
  claimToken?: string | null,
) {
  const conditions = [eq(embeddingOutbox.id, id)];
  if (claimToken) {
    conditions.push(eq(embeddingOutbox.claimToken, claimToken));
    conditions.push(eq(embeddingOutbox.status, "processing"));
  } else {
    conditions.push(eq(embeddingOutbox.status, "pending"));
  }

  await db
    .update(embeddingOutbox)
    .set({
      status: "completed",
      lastError: null,
      claimToken: null,
      claimedAt: null,
      nextAttemptAt: null,
      updatedAt: new Date(),
    })
    .where(and(...conditions));
}

export async function markEmbedOutboxFailed(
  id: string,
  claimToken: string,
  error: string,
  options?: { nextAttemptAt?: Date | null; dead?: boolean },
) {
  await db
    .update(embeddingOutbox)
    .set({
      status: options?.dead ? "dead" : "pending",
      lastError: error.slice(0, 500),
      claimToken: null,
      claimedAt: null,
      nextAttemptAt: options?.dead ? null : (options?.nextAttemptAt ?? new Date()),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(embeddingOutbox.id, id),
        eq(embeddingOutbox.claimToken, claimToken),
        eq(embeddingOutbox.status, "processing"),
      ),
    );
}

export async function markEmbedOutboxDiscarded(
  id: string,
  claimToken: string,
  reason: string,
) {
  await markEmbedOutboxFailed(id, claimToken, reason, { dead: true });
}
