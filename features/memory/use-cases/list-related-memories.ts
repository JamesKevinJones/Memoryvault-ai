import { getMemoryById } from "@/repositories/memories";
import { listRelated } from "@/repositories/memory-links";

export async function listRelatedMemoriesUseCase(
  workspaceId: string,
  memoryId: string,
) {
  const memory = await getMemoryById(workspaceId, memoryId);
  if (!memory) return null;
  const items = await listRelated(workspaceId, memoryId);
  return { items };
}
