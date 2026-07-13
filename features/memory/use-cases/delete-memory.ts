import { deleteMemory } from "@/repositories/memories";

export async function deleteMemoryUseCase(workspaceId: string, id: string) {
  return deleteMemory(workspaceId, id);
}
