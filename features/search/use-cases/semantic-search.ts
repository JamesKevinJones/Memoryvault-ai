import {
  orchestratorEmbed,
  orchestratorRetrieve,
} from "@/ai/orchestrator";

export async function semanticSearchUseCase(input: {
  workspaceId: string;
  userId: string;
  query: string;
  projectId?: string | null;
  category?: string;
  limit?: number;
}) {
  const ctx = {
    workspaceId: input.workspaceId,
    userId: input.userId,
    projectId: input.projectId,
  };

  const start = Date.now();
  const embedded = await orchestratorEmbed(ctx, input.query);
  const retrieved = await orchestratorRetrieve(ctx, embedded.vector, {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    category: input.category,
    limit: input.limit ?? 10,
  });

  return {
    items: retrieved.items,
    retrievalCount: retrieved.retrievalCount,
    latencyMs: Date.now() - start,
  };
}
