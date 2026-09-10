import { requireAuth, requireWorkspaceId } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { describeError, logger } from "@/lib/logger";
import { isProjectInWorkspace } from "@/features/projects/use-cases/verify-project-access";
import {
  createMemoryBodySchema,
  parseListMemoriesQuery,
  updateMemoryBodySchema,
} from "@/features/memory/api/memory-schemas";
import { deleteMemoryUseCase } from "@/features/memory/use-cases/delete-memory";
import { getMemoryUseCase } from "@/features/memory/use-cases/get-memory";
import { listMemoriesUseCase } from "@/features/memory/use-cases/list-memories";
import { listRelatedMemoriesUseCase } from "@/features/memory/use-cases/list-related-memories";
import { updateMemoryUseCase } from "@/features/memory/use-cases/update-memory";
import { embedMemoryForUser } from "@/features/memory/use-cases/embed-memory";
import {
  completePendingEmbedEvent,
  scheduleEmbedOutboxDispatch,
} from "@/features/memory/use-cases/enqueue-embed-retry";
import {
  createMemoryWithEmbedEvent,
  updateMemoryWithEmbedEvent,
} from "@/features/memory/use-cases/persist-memory-with-embed-event";

export {
  createMemoryBodySchema,
  listMemoriesQuerySchema,
  parseListMemoriesQuery,
  updateMemoryBodySchema,
} from "@/features/memory/api/memory-schemas";

type HandlerResult =
  | { ok: true; status: number; body: unknown }
  | { ok: false; status: number; body: { error: string } };

function validationError(): HandlerResult {
  return { ok: false, status: 400, body: { error: "validation failed" } };
}

function unauthorized(): HandlerResult {
  return { ok: false, status: 401, body: { error: "unauthorized" } };
}

function notFound(): HandlerResult {
  return { ok: false, status: 404, body: { error: "not found" } };
}

async function tryInlineEmbed(input: {
  workspaceId: string;
  userId: string;
  memoryId: string;
  title: string;
  content: string;
  projectId: string | null;
  jobId: string;
}) {
  try {
    await embedMemoryForUser({
      workspaceId: input.workspaceId,
      userId: input.userId,
      memoryId: input.memoryId,
      title: input.title,
      content: input.content,
      projectId: input.projectId,
    });
    await completePendingEmbedEvent(input.jobId);
  } catch (err) {
    // Not fatal: the event is already durable in embedding_outbox and the
    // dispatcher retries. Still worth a line — a persistent inline failure is
    // how you find out Bedrock access is misconfigured.
    logger.warn("inline embed failed, deferring to outbox", {
      memoryId: input.memoryId,
      workspaceId: input.workspaceId,
      error: describeError(err),
    });
    scheduleEmbedOutboxDispatch({ workspaceId: input.workspaceId });
  }
}

export async function handleListMemories(
  searchParams: URLSearchParams,
): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return unauthorized();

  const parsed = parseListMemoriesQuery(searchParams);
  if (!parsed.ok) return validationError();

  const { projectId, category, importance, q, sourceConversationId, cursor, limit } =
    parsed.data;
  const result = await listMemoriesUseCase(workspaceId, {
    projectId: projectId === "global" ? null : projectId,
    category,
    minImportance: importance,
    q,
    sourceConversationId,
    cursor,
    limit,
  });

  return { ok: true, status: 200, body: result };
}

export async function handleCreateMemory(body: unknown): Promise<HandlerResult> {
  const ctx = await requireAuth();
  if (!ctx) return unauthorized();

  // Creating or re-titling a memory triggers a Bedrock embedding call.
  const rate = await checkRateLimit("memoryWrite", ctx.userId);
  if (!rate.allowed) {
    return { ok: false, status: 429, body: { error: "rate limited" } };
  }

  const parsed = createMemoryBodySchema.safeParse(body);
  if (!parsed.success) return validationError();

  // A well-formed UUID is not proof of ownership: reject a projectId that
  // belongs to another workspace instead of storing a cross-tenant row.
  if (!(await isProjectInWorkspace(ctx.workspaceId, parsed.data.projectId))) {
    return notFound();
  }

  const { memory, job } = await createMemoryWithEmbedEvent({
    userId: ctx.userId,
    memory: {
      workspaceId: ctx.workspaceId,
      ...parsed.data,
    },
    operation: "create",
  });

  await tryInlineEmbed({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    memoryId: memory.id,
    title: memory.title,
    content: memory.content,
    projectId: memory.projectId,
    jobId: job.id,
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
  const ctx = await requireAuth();
  if (!ctx) return unauthorized();

  // Creating or re-titling a memory triggers a Bedrock embedding call.
  const rate = await checkRateLimit("memoryWrite", ctx.userId);
  if (!rate.allowed) {
    return { ok: false, status: 429, body: { error: "rate limited" } };
  }

  const parsed = updateMemoryBodySchema.safeParse(body);
  if (!parsed.success) return validationError();

  // A well-formed UUID is not proof of ownership: reject a projectId that
  // belongs to another workspace instead of storing a cross-tenant row.
  if (!(await isProjectInWorkspace(ctx.workspaceId, parsed.data.projectId))) {
    return notFound();
  }

  const { archived, ...fields } = parsed.data;
  const patch = {
    ...fields,
    ...(archived !== undefined
      ? { archivedAt: archived ? new Date() : null }
      : {}),
  };

  const needsReembed =
    fields.title !== undefined || fields.content !== undefined;

  if (needsReembed) {
    const result = await updateMemoryWithEmbedEvent({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      memoryId: id,
      patch,
    });
    if (!result) return notFound();

    await tryInlineEmbed({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      memoryId: result.memory.id,
      title: result.memory.title,
      content: result.memory.content,
      projectId: result.memory.projectId,
      jobId: result.job.id,
    });

    return { ok: true, status: 200, body: { memory: result.memory } };
  }

  const memory = await updateMemoryUseCase(ctx.workspaceId, id, patch);
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
