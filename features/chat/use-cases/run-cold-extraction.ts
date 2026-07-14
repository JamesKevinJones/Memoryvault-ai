import {
  orchestratorEmbed,
  orchestratorEmbedMemory,
  orchestratorExtractMemories,
  type OrchestratorContext,
} from "@/ai/orchestrator";
import type { ExtractedMemoryCandidate } from "@/ai/types";
import type { ColdExtractionJob } from "@/features/chat/use-cases/enqueue-cold-extraction";
import type { MemoryCategory } from "@/features/memory/types";
import {
  getConversation,
  getMessageById,
} from "@/repositories/conversations";
import { searchMemoriesByVector } from "@/repositories/embeddings";
import { upsertMemoryLink } from "@/repositories/memory-links";
import {
  createMemory,
  updateMemory,
  type Memory,
} from "@/repositories/memories";
import { createTask } from "@/repositories/tasks";

const DEDUPE_SCORE_THRESHOLD = 0.85;

function mergeMemoryContent(existing: string, incoming: string): string {
  if (existing.trim() === incoming.trim()) return existing;
  if (existing.includes(incoming)) return existing;
  if (incoming.includes(existing)) return incoming;
  return `${existing.trim()}\n\n${incoming.trim()}`;
}

async function upsertExtractedMemory(input: {
  ctx: OrchestratorContext;
  candidate: ExtractedMemoryCandidate;
  projectId?: string | null;
  sourceConversationId: string;
  sourceMessageId: string;
}): Promise<Memory> {
  const text = `${input.candidate.title}\n\n${input.candidate.content}`.trim();
  const embedded = await orchestratorEmbed(input.ctx, text, { path: "cold" });

  const similar = await searchMemoriesByVector({
    workspaceId: input.ctx.workspaceId,
    projectId: input.projectId,
    queryVector: embedded.vector,
    limit: 1,
  });

  const top = similar[0];
  if (top && top.score >= DEDUPE_SCORE_THRESHOLD) {
    const merged = await updateMemory(input.ctx.workspaceId, top.memoryId, {
      content: mergeMemoryContent(top.content, input.candidate.content),
      importance: Math.max(top.importance, input.candidate.importance),
      category: input.candidate.category as MemoryCategory,
    });

    if (!merged) {
      throw new Error("failed to merge extracted memory");
    }

    await orchestratorEmbedMemory(input.ctx, merged.id, text, { path: "cold" });
    return merged;
  }

  const created = await createMemory({
    workspaceId: input.ctx.workspaceId,
    projectId: input.projectId,
    category: input.candidate.category as MemoryCategory,
    title: input.candidate.title,
    content: input.candidate.content,
    importance: input.candidate.importance,
    sourceConversationId: input.sourceConversationId,
    sourceMessageId: input.sourceMessageId,
  });

  await orchestratorEmbedMemory(input.ctx, created.id, text, { path: "cold" });
  return created;
}

export async function runColdExtraction(
  ctx: OrchestratorContext,
  job: ColdExtractionJob,
) {
  const [userMessage, assistantMessage, conversation] = await Promise.all([
    getMessageById(job.userMessageId),
    getMessageById(job.assistantMessageId),
    getConversation(ctx.workspaceId, job.conversationId),
  ]);

  if (!userMessage || !assistantMessage || !conversation) {
    throw new Error("cold extraction inputs not found");
  }

  const extracted = await orchestratorExtractMemories(ctx, {
    userMessage: userMessage.content,
    assistantMessage: assistantMessage.content,
  });

  const titleToId = new Map<string, string>();
  const memoryIds: string[] = [];

  for (const candidate of extracted.memories) {
    const memory = await upsertExtractedMemory({
      ctx,
      candidate,
      projectId: conversation.projectId,
      sourceConversationId: job.conversationId,
      sourceMessageId: job.assistantMessageId,
    });
    titleToId.set(candidate.title.trim().toLowerCase(), memory.id);
    memoryIds.push(memory.id);
  }

  for (const candidate of extracted.memories) {
    const fromId = titleToId.get(candidate.title.trim().toLowerCase());
    if (!fromId || !candidate.relatedTitles?.length) continue;

    for (const relatedTitle of candidate.relatedTitles) {
      const toId = titleToId.get(relatedTitle.trim().toLowerCase());
      if (!toId) continue;
      await upsertMemoryLink({ fromMemoryId: fromId, toMemoryId: toId });
    }
  }

  const taskIds: string[] = [];
  for (const task of extracted.tasks) {
    const created = await createTask({
      workspaceId: ctx.workspaceId,
      projectId: conversation.projectId,
      title: task.title,
    });
    taskIds.push(created.id);
  }

  return {
    memoryIds,
    taskIds,
    extractedCount: extracted.memories.length,
    taskCount: extracted.tasks.length,
  };
}
