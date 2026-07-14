import { db } from "@/db/client";
import type { CreateMemoryInput, UpdateMemoryInput } from "@/features/memory/types";
import type { EmbedOutboxOperation } from "@/db/schema/embedding-outbox";
import { createMemory, updateMemory } from "@/repositories/memories";
import {
  enqueueEmbedOutboxJob,
  supersedePendingEmbedJobsForMemory,
} from "@/repositories/embedding-outbox";

export async function createMemoryWithEmbedEvent(input: {
  memory: CreateMemoryInput;
  userId: string;
  operation?: EmbedOutboxOperation;
}) {
  return db.transaction(async (tx) => {
    const memory = await createMemory(input.memory, tx);
    const job = await enqueueEmbedOutboxJob(
      {
        workspaceId: memory.workspaceId,
        userId: input.userId,
        memoryId: memory.id,
        projectId: memory.projectId,
        title: memory.title,
        content: memory.content,
        operation: input.operation ?? "create",
      },
      tx,
    );
    return { memory, job };
  });
}

export async function updateMemoryWithEmbedEvent(input: {
  workspaceId: string;
  userId: string;
  memoryId: string;
  patch: UpdateMemoryInput;
}) {
  return db.transaction(async (tx) => {
    const memory = await updateMemory(
      input.workspaceId,
      input.memoryId,
      input.patch,
      tx,
    );
    if (!memory) return null;

    await supersedePendingEmbedJobsForMemory(memory.id, tx);
    const job = await enqueueEmbedOutboxJob(
      {
        workspaceId: memory.workspaceId,
        userId: input.userId,
        memoryId: memory.id,
        projectId: memory.projectId,
        title: memory.title,
        content: memory.content,
        operation: "update",
      },
      tx,
    );
    return { memory, job };
  });
}
