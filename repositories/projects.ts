import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { projects } from "@/db/schema";

export type Project = typeof projects.$inferSelect;

export async function listProjects(workspaceId: string): Promise<Project[]> {
  return db
    .select()
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId))
    .orderBy(desc(projects.updatedAt));
}

export async function getProjectById(
  workspaceId: string,
  id: string,
): Promise<Project | null> {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
    .limit(1);

  return row ?? null;
}

export async function createProject(input: {
  workspaceId: string;
  name: string;
  description?: string | null;
}): Promise<Project> {
  const now = new Date();
  const [row] = await db
    .insert(projects)
    .values({
      id: crypto.randomUUID(),
      workspaceId: input.workspaceId,
      name: input.name,
      description: input.description ?? null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return row;
}

export async function updateProject(
  workspaceId: string,
  id: string,
  patch: Partial<Pick<Project, "name" | "description" | "status">>,
): Promise<Project | null> {
  const [row] = await db
    .update(projects)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
    .returning();

  return row ?? null;
}

export async function deleteProject(
  workspaceId: string,
  id: string,
): Promise<boolean> {
  const deleted = await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
    .returning({ id: projects.id });

  return deleted.length > 0;
}
