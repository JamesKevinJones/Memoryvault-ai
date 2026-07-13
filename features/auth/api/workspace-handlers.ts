import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { workspaces } from "@/db/schema";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";

export async function getWorkspace() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { workspaceId } = await ensureWorkspace(session.user.id);
  const [ws] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  return ws ?? null;
}

export async function updateWorkspaceName(name: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { workspaceId } = await ensureWorkspace(session.user.id);
  const [ws] = await db
    .update(workspaces)
    .set({ name, updatedAt: new Date() })
    .where(eq(workspaces.id, workspaceId))
    .returning();
  return ws ?? null;
}
