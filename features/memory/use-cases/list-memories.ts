import { listMemories } from "@/repositories/memories";
import type { MemoryListFilters } from "@/features/memory/types";

export async function listMemoriesUseCase(
  workspaceId: string,
  filters: Omit<MemoryListFilters, "workspaceId">,
) {
  return listMemories({ workspaceId, ...filters });
}
