import { orchestratorEmbedMemory } from "@/ai/orchestrator";

export async function embedMemoryForUser(input: {
  workspaceId: string;
  userId: string;
  memoryId: string;
  title: string;
  content: string;
  projectId?: string | null;
}) {
  const text = `${input.title}\n\n${input.content}`.trim();
  await orchestratorEmbedMemory(
    {
      workspaceId: input.workspaceId,
      userId: input.userId,
      projectId: input.projectId,
    },
    input.memoryId,
    text,
  );
}
