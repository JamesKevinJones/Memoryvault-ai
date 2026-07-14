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

export async function upsertMemoryLink(input: {
  fromMemoryId: string;
  toMemoryId: string;
  relationType?: string;
}) {
  if (input.fromMemoryId === input.toMemoryId) return;

  const relationType = input.relationType ?? "related";
  const existing = await db
    .select({ id: memoryLinks.id })
    .from(memoryLinks)
    .where(
      and(
        eq(memoryLinks.fromMemoryId, input.fromMemoryId),
        eq(memoryLinks.toMemoryId, input.toMemoryId),
        eq(memoryLinks.relationType, relationType),
      ),
    )
    .limit(1);

  if (existing[0]) return;

  await db.insert(memoryLinks).values({
    id: crypto.randomUUID(),
    fromMemoryId: input.fromMemoryId,
    toMemoryId: input.toMemoryId,
    relationType,
    strength: 1,
  });
}
