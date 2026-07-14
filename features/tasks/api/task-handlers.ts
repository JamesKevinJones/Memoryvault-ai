import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";
import {
  createTaskBodySchema,
  parseListTasksQuery,
  updateTaskBodySchema,
} from "@/features/tasks/api/task-schemas";
import {
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  updateTask,
} from "@/repositories/tasks";

type HandlerResult =
  | { ok: true; status: number; body: unknown }
  | { ok: false; status: number; body: { error: string } };

async function requireWorkspaceId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { workspaceId } = await ensureWorkspace(session.user.id);
  return workspaceId;
}

export async function handleListTasks(
  searchParams: URLSearchParams,
): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return { ok: false, status: 401, body: { error: "unauthorized" } };

  const parsed = parseListTasksQuery(searchParams);
  if (!parsed.ok) return { ok: false, status: 400, body: { error: "validation failed" } };

  const items = await listTasks({
    workspaceId,
    projectId:
      parsed.data.projectId === "global"
        ? null
        : parsed.data.projectId,
    status: parsed.data.status,
  });

  return { ok: true, status: 200, body: { items } };
}

export async function handleCreateTask(body: unknown): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return { ok: false, status: 401, body: { error: "unauthorized" } };

  const parsed = createTaskBodySchema.safeParse(body);
  if (!parsed.success) return { ok: false, status: 400, body: { error: "validation failed" } };

  const task = await createTask({ workspaceId, ...parsed.data });
  return { ok: true, status: 201, body: { task } };
}

export async function handleGetTask(id: string): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return { ok: false, status: 401, body: { error: "unauthorized" } };

  const task = await getTaskById(workspaceId, id);
  if (!task) return { ok: false, status: 404, body: { error: "not found" } };

  return { ok: true, status: 200, body: { task } };
}

export async function handleUpdateTask(
  id: string,
  body: unknown,
): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return { ok: false, status: 401, body: { error: "unauthorized" } };

  const parsed = updateTaskBodySchema.safeParse(body);
  if (!parsed.success) return { ok: false, status: 400, body: { error: "validation failed" } };

  const task = await updateTask(workspaceId, id, parsed.data);
  if (!task) return { ok: false, status: 404, body: { error: "not found" } };

  return { ok: true, status: 200, body: { task } };
}

export async function handleDeleteTask(id: string): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return { ok: false, status: 401, body: { error: "unauthorized" } };

  const deleted = await deleteTask(workspaceId, id);
  if (!deleted) return { ok: false, status: 404, body: { error: "not found" } };

  return { ok: true, status: 204, body: null };
}

export function toResponse(result: HandlerResult): Response {
  if (result.status === 204) return new Response(null, { status: 204 });
  return Response.json(result.body, { status: result.status });
}
