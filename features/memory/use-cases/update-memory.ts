import { updateMemory } from "@/repositories/memories";
import type { UpdateMemoryInput } from "@/features/memory/types";

export async function updateMemoryUseCase(
  workspaceId: string,
  id: string,
  patch: UpdateMemoryInput,
) {
  return updateMemory(workspaceId, id, patch);
}
