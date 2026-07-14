import { and, count, eq, gte, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { memories, projects, tasks } from "@/db/schema";

export type WorkspaceStats = {
  totalMemories: number;
  pinnedMemories: number;
  totalProjects: number;
  newThisWeek: number;
  openTasks: number;
};

/**
 * Additive, read-only aggregate for the dashboard hero. Does not touch any
 * existing table or endpoint contract — purely derived counts.
 */
export async function getWorkspaceStats(
  workspaceId: string,
): Promise<WorkspaceStats> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalRow, pinnedRow, projectRow, weekRow, taskRow] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(memories)
        .where(
          and(eq(memories.workspaceId, workspaceId), isNull(memories.archivedAt)),
        ),
      db
        .select({ value: count() })
        .from(memories)
        .where(
          and(
            eq(memories.workspaceId, workspaceId),
            isNull(memories.archivedAt),
            eq(memories.pinned, true),
          ),
        ),
      db.select({ value: count() }).from(projects).where(eq(projects.workspaceId, workspaceId)),
      db
        .select({ value: count() })
        .from(memories)
        .where(
          and(
            eq(memories.workspaceId, workspaceId),
            isNull(memories.archivedAt),
            gte(memories.createdAt, weekAgo),
          ),
        ),
      db
        .select({ value: count() })
        .from(tasks)
        .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.status, "open"))),
    ]);

  return {
    totalMemories: totalRow[0]?.value ?? 0,
    pinnedMemories: pinnedRow[0]?.value ?? 0,
    totalProjects: projectRow[0]?.value ?? 0,
    newThisWeek: weekRow[0]?.value ?? 0,
    openTasks: taskRow[0]?.value ?? 0,
  };
}
