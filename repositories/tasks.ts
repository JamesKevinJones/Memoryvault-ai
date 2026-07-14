import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { tasks } from "@/db/schema";

export type Task = typeof tasks.$inferSelect;

export async function listOpenTasks(input: {
  workspaceId: string;
  projectId?: string | null;
  limit?: number;
}): Promise<Task[]> {
  const conditions = [
    eq(tasks.workspaceId, input.workspaceId),
    eq(tasks.status, "open"),
  ];

  if (input.projectId === null) {
    conditions.push(isNull(tasks.projectId));
  } else if (input.projectId !== undefined) {
    conditions.push(eq(tasks.projectId, input.projectId));
  }

  return db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.updatedAt))
    .limit(input.limit ?? 5);
}
