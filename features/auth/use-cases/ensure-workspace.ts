import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, workspaces } from "@/db/schema";

export function defaultWorkspaceName(userName: string | null | undefined): string {
  return userName ? `${userName}'s Vault` : "My Vault";
}

export async function ensureWorkspace(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("User not found");

  if (user.workspaceId) {
    const [ws] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, user.workspaceId))
      .limit(1);
    if (!ws) throw new Error("Workspace missing");
    return { workspaceId: ws.id, name: ws.name };
  }

  const workspaceId = crypto.randomUUID();
  const name = defaultWorkspaceName(user.name);

  await db.transaction(async (tx) => {
    await tx.insert(workspaces).values({ id: workspaceId, name });
    await tx
      .update(users)
      .set({ workspaceId, updatedAt: new Date() })
      .where(eq(users.id, userId));
  });

  return { workspaceId, name };
}
