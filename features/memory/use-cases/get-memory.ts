import { getMemoryById } from "@/repositories/memories";

export async function getMemoryUseCase(workspaceId: string, id: string) {
  return getMemoryById(workspaceId, id);
}
