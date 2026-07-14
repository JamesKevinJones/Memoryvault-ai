import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { tasks } from "@/db/schema";

export type Task = typeof tasks.$inferSelect;

export async function listTasks(input: {
  workspaceId: string;
  projectId?: string | null;
  status?: string;
  limit?: number;
}): Promise<Task[]> {
  const conditions = [eq(tasks.workspaceId, input.workspaceId)];

  if (input.projectId === null) {
    conditions.push(isNull(tasks.projectId));
  } else if (input.projectId !== undefined) {
    conditions.push(eq(tasks.projectId, input.projectId));
  }

  if (input.status) {
    conditions.push(eq(tasks.status, input.status));
  }

  return db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.updatedAt))
    .limit(input.limit ?? 50);
}

export async function listOpenTasks(input: {
  workspaceId: string;
  projectId?: string | null;
  limit?: number;
}): Promise<Task[]> {
  return listTasks({ ...input, status: "open" });
}

export async function getTaskById(
  workspaceId: string,
  id: string,
): Promise<Task | null> {
  const [row] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.workspaceId, workspaceId)))
    .limit(1);

  return row ?? null;
}

export async function createTask(input: {
  workspaceId: string;
  projectId?: string | null;
  title: string;
  memoryId?: string | null;
}): Promise<Task> {
  const now = new Date();
  const [row] = await db
    .insert(tasks)
    .values({
      id: crypto.randomUUID(),
      workspaceId: input.workspaceId,
      projectId: input.projectId ?? null,
      title: input.title,
      status: "open",
      memoryId: input.memoryId ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return row;
}

export async function updateTask(
  workspaceId: string,
  id: string,
  patch: Partial<Pick<Task, "title" | "status" | "projectId" | "dueAt">>,
): Promise<Task | null> {
  const [row] = await db
    .update(tasks)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.workspaceId, workspaceId)))
    .returning();

  return row ?? null;
}

export async function deleteTask(
  workspaceId: string,
  id: string,
): Promise<boolean> {
  const deleted = await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.workspaceId, workspaceId)))
    .returning({ id: tasks.id });

  return deleted.length > 0;
}
