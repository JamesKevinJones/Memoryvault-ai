import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { memories, memoryLinks } from "@/db/schema";
import type { Memory } from "@/repositories/memories";

export async function listRelated(
  workspaceId: string,
  memoryId: string,
): Promise<Memory[]> {
  const outbound = db
    .select({ related: memories })
    .from(memoryLinks)
    .innerJoin(memories, eq(memoryLinks.toMemoryId, memories.id))
    .where(
      and(
        eq(memoryLinks.fromMemoryId, memoryId),
        eq(memories.workspaceId, workspaceId),
        isNull(memories.archivedAt),
      ),
    );

  const inbound = db
    .select({ related: memories })
    .from(memoryLinks)
    .innerJoin(memories, eq(memoryLinks.fromMemoryId, memories.id))
    .where(
      and(
        eq(memoryLinks.toMemoryId, memoryId),
        eq(memories.workspaceId, workspaceId),
        isNull(memories.archivedAt),
      ),
    );

  const [outRows, inRows] = await Promise.all([outbound, inbound]);
  const seen = new Set<string>();
  const result: Memory[] = [];

  for (const row of [...outRows, ...inRows]) {
    if (row.related.id === memoryId || seen.has(row.related.id)) continue;
    seen.add(row.related.id);
    result.push(row.related);
  }

  return result;
}
