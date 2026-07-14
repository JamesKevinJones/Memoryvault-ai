import { z } from "zod";
import { MEMORY_CATEGORIES } from "@/features/memory/types";
import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";
import { semanticSearchUseCase } from "@/features/search/use-cases/semantic-search";

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1),
  projectId: z.string().uuid().optional().or(z.literal("global")),
  category: z.enum(MEMORY_CATEGORIES).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export function parseSearchQuery(
  searchParams: URLSearchParams,
): { ok: true; data: z.infer<typeof searchQuerySchema> } | { ok: false } {
  const parsed = searchQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    projectId: searchParams.get("projectId") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) return { ok: false };
  return { ok: true, data: parsed.data };
}

export const searchBodySchema = searchQuerySchema;

type HandlerResult =
  | { ok: true; status: number; body: unknown }
  | { ok: false; status: number; body: { error: string } };

export async function handleSemanticSearch(
  input: z.infer<typeof searchQuerySchema>,
): Promise<HandlerResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, status: 401, body: { error: "unauthorized" } };
  }

  const { workspaceId } = await ensureWorkspace(session.user.id);
  const projectId =
    input.projectId === "global"
      ? null
      : input.projectId === undefined
        ? undefined
        : input.projectId;

  const result = await semanticSearchUseCase({
    workspaceId,
    userId: session.user.id,
    query: input.q,
    projectId,
    category: input.category,
    limit: input.limit,
  });

  return {
    ok: true,
    status: 200,
    body: {
      items: result.items,
      retrievalCount: result.retrievalCount,
      latencyMs: result.latencyMs,
    },
  };
}
