import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";
import {
  createMemoryBodySchema,
  parseListMemoriesQuery,
  updateMemoryBodySchema,
} from "@/features/memory/api/memory-schemas";
import { createMemoryUseCase } from "@/features/memory/use-cases/create-memory";
import { deleteMemoryUseCase } from "@/features/memory/use-cases/delete-memory";
import { getMemoryUseCase } from "@/features/memory/use-cases/get-memory";
import { listMemoriesUseCase } from "@/features/memory/use-cases/list-memories";
import { listRelatedMemoriesUseCase } from "@/features/memory/use-cases/list-related-memories";
import { updateMemoryUseCase } from "@/features/memory/use-cases/update-memory";

export {
  createMemoryBodySchema,
  listMemoriesQuerySchema,
  parseListMemoriesQuery,
  updateMemoryBodySchema,
} from "@/features/memory/api/memory-schemas";

type HandlerResult =
  | { ok: true; status: number; body: unknown }
  | { ok: false; status: number; body: { error: string } };

async function requireWorkspaceId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { workspaceId } = await ensureWorkspace(session.user.id);
  return workspaceId;
}

function validationError(): HandlerResult {
  return { ok: false, status: 400, body: { error: "validation failed" } };
}

function unauthorized(): HandlerResult {
  return { ok: false, status: 401, body: { error: "unauthorized" } };
}

function notFound(): HandlerResult {
  return { ok: false, status: 404, body: { error: "not found" } };
}

export async function handleListMemories(
  searchParams: URLSearchParams,
): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return unauthorized();

  const parsed = parseListMemoriesQuery(searchParams);
  if (!parsed.ok) return validationError();

  const { projectId, category, importance, q, cursor, limit } = parsed.data;
  const result = await listMemoriesUseCase(workspaceId, {
    projectId: projectId === "global" ? null : projectId,
    category,
    minImportance: importance,
    q,
    cursor,
    limit,
  });

  return { ok: true, status: 200, body: result };
}

export async function handleCreateMemory(body: unknown): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return unauthorized();

  const parsed = createMemoryBodySchema.safeParse(body);
  if (!parsed.success) return validationError();

  const memory = await createMemoryUseCase({
    workspaceId,
    ...parsed.data,
  });

  return { ok: true, status: 201, body: { memory } };
}

export async function handleGetMemory(id: string): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return unauthorized();

  const memory = await getMemoryUseCase(workspaceId, id);
  if (!memory) return notFound();

  return { ok: true, status: 200, body: { memory } };
}

export async function handleUpdateMemory(
  id: string,
  body: unknown,
): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return unauthorized();

  const parsed = updateMemoryBodySchema.safeParse(body);
  if (!parsed.success) return validationError();

  const { archived, ...fields } = parsed.data;
  const patch = {
    ...fields,
    ...(archived !== undefined
      ? { archivedAt: archived ? new Date() : null }
      : {}),
  };

  const memory = await updateMemoryUseCase(workspaceId, id, patch);
  if (!memory) return notFound();

  return { ok: true, status: 200, body: { memory } };
}

export async function handleDeleteMemory(id: string): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return unauthorized();

  const deleted = await deleteMemoryUseCase(workspaceId, id);
  if (!deleted) return notFound();

  return { ok: true, status: 204, body: null };
}

export async function handleListRelatedMemories(
  id: string,
): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return unauthorized();

  const result = await listRelatedMemoriesUseCase(workspaceId, id);
  if (!result) return notFound();

  return { ok: true, status: 200, body: result };
}

export function toResponse(result: HandlerResult): Response {
  if (result.status === 204) return new Response(null, { status: 204 });
  return Response.json(result.body, { status: result.status });
}
