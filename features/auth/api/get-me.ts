import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";

export async function getMe() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const ws = await ensureWorkspace(session.user.id);
  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
    workspaceId: ws.workspaceId,
  };
}
