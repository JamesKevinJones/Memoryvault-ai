import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";

export type AuthedContext = {
  userId: string;
  workspaceId: string;
  user: { name?: string | null; email?: string | null; image?: string | null };
};

/**
 * The single authentication gate for every request handler.
 *
 * Deliberately a positive assertion rather than `if (!session?.user?.id)`.
 * GHSA-8fpg-xm3f-6cx3 describes Auth.js returning a session object that is
 * populated *and* carries an error when configuration fails — under which an
 * existence check fails open. So: reject anything carrying an error marker,
 * and require the id to be a genuinely non-empty string before trusting it.
 */
export async function requireAuth(): Promise<AuthedContext | null> {
  const session = await auth();
  if (!session || typeof session !== "object") return null;
  if ("error" in session && session.error) return null;

  const userId = session.user?.id;
  if (typeof userId !== "string" || userId.trim().length === 0) return null;

  const { workspaceId } = await ensureWorkspace(userId);
  if (typeof workspaceId !== "string" || workspaceId.length === 0) return null;

  return { userId, workspaceId, user: session.user };
}

/** Convenience wrapper for handlers that only need the tenant, not the user. */
export async function requireWorkspaceId(): Promise<string | null> {
  const ctx = await requireAuth();
  return ctx?.workspaceId ?? null;
}
