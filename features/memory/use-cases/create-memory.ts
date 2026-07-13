import { createMemory } from "@/repositories/memories";
import type { CreateMemoryInput } from "@/features/memory/types";

export async function createMemoryUseCase(
  input: Omit<CreateMemoryInput, "workspaceId"> & { workspaceId: string },
) {
  return createMemory(input);
}
