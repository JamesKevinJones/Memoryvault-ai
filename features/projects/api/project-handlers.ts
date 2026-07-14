import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";
import {
  createProjectBodySchema,
  updateProjectBodySchema,
} from "@/features/projects/api/project-schemas";
import {
  createProject,
  deleteProject,
  getProjectById,
  listProjects,
  updateProject,
} from "@/repositories/projects";

type HandlerResult =
  | { ok: true; status: number; body: unknown }
  | { ok: false; status: number; body: { error: string } };

async function requireWorkspaceId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { workspaceId } = await ensureWorkspace(session.user.id);
  return workspaceId;
}

export async function handleListProjects(): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return { ok: false, status: 401, body: { error: "unauthorized" } };

  const items = await listProjects(workspaceId);
  return { ok: true, status: 200, body: { items } };
}

export async function handleCreateProject(body: unknown): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return { ok: false, status: 401, body: { error: "unauthorized" } };

  const parsed = createProjectBodySchema.safeParse(body);
  if (!parsed.success) return { ok: false, status: 400, body: { error: "validation failed" } };

  const project = await createProject({ workspaceId, ...parsed.data });
  return { ok: true, status: 201, body: { project } };
}

export async function handleGetProject(id: string): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return { ok: false, status: 401, body: { error: "unauthorized" } };

  const project = await getProjectById(workspaceId, id);
  if (!project) return { ok: false, status: 404, body: { error: "not found" } };

  return { ok: true, status: 200, body: { project } };
}

export async function handleUpdateProject(
  id: string,
  body: unknown,
): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return { ok: false, status: 401, body: { error: "unauthorized" } };

  const parsed = updateProjectBodySchema.safeParse(body);
  if (!parsed.success) return { ok: false, status: 400, body: { error: "validation failed" } };

  const project = await updateProject(workspaceId, id, parsed.data);
  if (!project) return { ok: false, status: 404, body: { error: "not found" } };

  return { ok: true, status: 200, body: { project } };
}

export async function handleDeleteProject(id: string): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return { ok: false, status: 401, body: { error: "unauthorized" } };

  const deleted = await deleteProject(workspaceId, id);
  if (!deleted) return { ok: false, status: 404, body: { error: "not found" } };

  return { ok: true, status: 204, body: null };
}

export function toResponse(result: HandlerResult): Response {
  if (result.status === 204) return new Response(null, { status: 204 });
  return Response.json(result.body, { status: result.status });
}
