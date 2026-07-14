import { and, cosineDistance, eq, isNull, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { embeddings, memories } from "@/db/schema";
import type { RetrievedMemory } from "@/ai/types";

export async function upsertMemoryEmbedding(input: {
  memoryId: string;
  modelId: string;
  dimensions: number;
  vector: number[];
}) {
  const existing = await db
    .select({ id: embeddings.id })
    .from(embeddings)
    .where(eq(embeddings.memoryId, input.memoryId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(embeddings)
      .set({
        modelId: input.modelId,
        dimensions: input.dimensions,
        vector: input.vector,
        createdAt: new Date(),
      })
      .where(eq(embeddings.id, existing[0].id));
    return;
  }

  await db.insert(embeddings).values({
    id: crypto.randomUUID(),
    memoryId: input.memoryId,
    modelId: input.modelId,
    dimensions: input.dimensions,
    vector: input.vector,
  });
}

export async function searchMemoriesByVector(input: {
  workspaceId: string;
  projectId?: string | null;
  category?: string;
  queryVector: number[];
  limit: number;
}): Promise<RetrievedMemory[]> {
  const distance = cosineDistance(embeddings.vector, input.queryVector);
  const score = sql<number>`1 - (${distance})`;

  const conditions = [
    eq(memories.workspaceId, input.workspaceId),
    isNull(memories.archivedAt),
    isNotNull(embeddings.vector),
  ];

  if (input.projectId === null) {
    conditions.push(isNull(memories.projectId));
  } else if (input.projectId !== undefined) {
    conditions.push(eq(memories.projectId, input.projectId));
  }

  if (input.category) {
    conditions.push(eq(memories.category, input.category));
  }

  const rows = await db
    .select({
      memoryId: memories.id,
      title: memories.title,
      content: memories.content,
      category: memories.category,
      importance: memories.importance,
      projectId: memories.projectId,
      score,
    })
    .from(memories)
    .innerJoin(embeddings, eq(embeddings.memoryId, memories.id))
    .where(and(...conditions))
    .orderBy(distance)
    .limit(input.limit);

  return rows.map((row) => ({
    memoryId: row.memoryId,
    title: row.title,
    content: row.content,
    category: row.category,
    importance: row.importance,
    projectId: row.projectId,
    score: Number(row.score),
  }));
}
