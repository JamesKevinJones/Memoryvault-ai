import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { documents } from "@/db/schema";

export type Document = typeof documents.$inferSelect;

export async function listDocuments(input: {
  workspaceId: string;
  projectId?: string | null;
  limit?: number;
}): Promise<Document[]> {
  const conditions = [eq(documents.workspaceId, input.workspaceId)];

  if (input.projectId === null) {
    conditions.push(isNull(documents.projectId));
  } else if (input.projectId !== undefined) {
    conditions.push(eq(documents.projectId, input.projectId));
  }

  return db
    .select()
    .from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.updatedAt))
    .limit(input.limit ?? 50);
}

export async function getDocumentById(
  workspaceId: string,
  id: string,
): Promise<Document | null> {
  const [row] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.workspaceId, workspaceId)))
    .limit(1);

  return row ?? null;
}

export async function createDocument(input: {
  workspaceId: string;
  projectId?: string | null;
  title: string;
  body: string;
}): Promise<Document> {
  const now = new Date();
  const [row] = await db
    .insert(documents)
    .values({
      id: crypto.randomUUID(),
      workspaceId: input.workspaceId,
      projectId: input.projectId ?? null,
      title: input.title,
      body: input.body,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return row;
}

export async function updateDocument(
  workspaceId: string,
  id: string,
  patch: Partial<Pick<Document, "title" | "body" | "projectId">>,
): Promise<Document | null> {
  const [row] = await db
    .update(documents)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(documents.id, id), eq(documents.workspaceId, workspaceId)))
    .returning();

  return row ?? null;
}

export async function deleteDocument(
  workspaceId: string,
  id: string,
): Promise<boolean> {
  const deleted = await db
    .delete(documents)
    .where(and(eq(documents.id, id), eq(documents.workspaceId, workspaceId)))
    .returning({ id: documents.id });

  return deleted.length > 0;
}
