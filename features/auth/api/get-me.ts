import { requireAuth } from "@/lib/session";

export async function getMe() {
  const ctx = await requireAuth();
  if (!ctx) return null;
  return {
    id: ctx.userId,
    name: ctx.user.name ?? null,
    email: ctx.user.email ?? null,
    image: ctx.user.image ?? null,
    workspaceId: ctx.workspaceId,
  };
}
