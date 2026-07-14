import {
  handleDeleteProject,
  handleGetProject,
  handleUpdateProject,
  toResponse,
} from "@/features/projects/api/project-handlers";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  return toResponse(await handleGetProject(id));
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  return toResponse(await handleUpdateProject(id, body));
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  return toResponse(await handleDeleteProject(id));
}
