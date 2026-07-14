import type {
  ChatPromptPack,
  EmbedResult,
  RetrieveResult,
  RetrieveScope,
} from "@/ai/types";
import { invokeEmbedding } from "@/ai/bedrock/embeddings";
import { streamConverse } from "@/ai/bedrock/generate";
import {
  BEDROCK_CHAT_MODEL_ID,
  BEDROCK_EMBED_DIMENSIONS,
  BEDROCK_EMBED_MODEL_ID,
} from "@/ai/config";
import {
  buildChatPrompt,
  type BuildChatPromptInput,
} from "@/ai/prompts/chat";
import { recordAiRun } from "@/repositories/ai-runs";
import { searchMemoriesByVector, upsertMemoryEmbedding } from "@/repositories/embeddings";

export type OrchestratorContext = {
  workspaceId: string;
  userId: string;
  projectId?: string | null;
  conversationId?: string | null;
};

async function timed<T>(
  operation: string,
  path: "hot" | "cold",
  ctx: OrchestratorContext,
  fn: () => Promise<T>,
  extra?: (result: T) => {
    retrievalCount?: number;
    modelId?: string | null;
  },
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const meta = extra?.(result);
    await recordAiRun({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      conversationId: ctx.conversationId ?? null,
      projectId: ctx.projectId ?? null,
      path,
      operation,
      modelId: meta?.modelId ?? BEDROCK_EMBED_MODEL_ID,
      latencyMs: Date.now() - start,
      retrievalCount: meta?.retrievalCount ?? null,
      cacheHit: null,
      status: "ok",
      error: null,
    });
    return result;
  } catch (err) {
    await recordAiRun({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      conversationId: ctx.conversationId ?? null,
      projectId: ctx.projectId ?? null,
      path,
      operation,
      modelId: extra ? null : BEDROCK_EMBED_MODEL_ID,
      latencyMs: Date.now() - start,
      retrievalCount: null,
      cacheHit: null,
      status: "error",
      error: err instanceof Error ? err.message.slice(0, 500) : "unknown error",
    });
    throw err;
  }
}

export async function orchestratorEmbed(
  ctx: OrchestratorContext,
  text: string,
): Promise<EmbedResult> {
  return timed("embed", "hot", ctx, async () => {
    const vector = await invokeEmbedding(text);
    return {
      vector,
      modelId: BEDROCK_EMBED_MODEL_ID,
      dimensions: BEDROCK_EMBED_DIMENSIONS,
    };
  });
}

export async function orchestratorRetrieve(
  ctx: OrchestratorContext,
  queryVector: number[],
  scope: RetrieveScope,
): Promise<RetrieveResult> {
  return timed(
    "retrieve",
    "hot",
    ctx,
    async () => {
      const items = await searchMemoriesByVector({
        workspaceId: scope.workspaceId,
        projectId: scope.projectId,
        category: scope.category,
        queryVector,
        limit: scope.limit ?? 10,
      });
      return { items, retrievalCount: items.length };
    },
    (result) => ({ retrievalCount: result.retrievalCount }),
  );
}

export async function orchestratorEmbedMemory(
  ctx: OrchestratorContext,
  memoryId: string,
  text: string,
): Promise<void> {
  const embedded = await orchestratorEmbed(ctx, text);
  await upsertMemoryEmbedding({
    memoryId,
    modelId: embedded.modelId,
    dimensions: embedded.dimensions,
    vector: embedded.vector,
  });
}

export async function orchestratorBuildPrompt(
  input: BuildChatPromptInput,
): Promise<ChatPromptPack> {
  return buildChatPrompt(input);
}

export async function* orchestratorGenerate(
  ctx: OrchestratorContext,
  prompt: ChatPromptPack,
): AsyncGenerator<string> {
  const start = Date.now();
  let output = "";

  try {
    for await (const chunk of streamConverse({
      system: prompt.system,
      messages: prompt.messages,
    })) {
      output += chunk;
      yield chunk;
    }

    await recordAiRun({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      conversationId: ctx.conversationId ?? null,
      projectId: ctx.projectId ?? null,
      path: "hot",
      operation: "generate",
      modelId: BEDROCK_CHAT_MODEL_ID,
      latencyMs: Date.now() - start,
      retrievalCount: prompt.citations.length,
      cacheHit: null,
      status: "ok",
      error: null,
    });
  } catch (err) {
    await recordAiRun({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      conversationId: ctx.conversationId ?? null,
      projectId: ctx.projectId ?? null,
      path: "hot",
      operation: "generate",
      modelId: BEDROCK_CHAT_MODEL_ID,
      latencyMs: Date.now() - start,
      retrievalCount: null,
      cacheHit: null,
      status: "error",
      error: err instanceof Error ? err.message.slice(0, 500) : "unknown error",
    });
    throw err;
  }

  if (!output.trim()) {
    throw new Error("Bedrock returned empty response");
  }
}

/** M4: memory extraction */
export function orchestratorExtractMemories(): never {
  throw new Error("orchestratorExtractMemories is not implemented until M4");
}
