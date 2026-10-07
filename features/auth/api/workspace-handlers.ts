import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { workspaces } from "@/db/schema";
import { requireWorkspaceId } from "@/lib/session";

export async function getWorkspace() {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return null;
  const [ws] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  return ws ?? null;
}

export async function updateWorkspaceName(name: string) {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return null;
  const [ws] = await db
    .update(workspaces)
    .set({ name, updatedAt: new Date() })
    .where(eq(workspaces.id, workspaceId))
    .returning();
  return ws ?? null;
}
