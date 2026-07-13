import {
  handleDeleteMemory,
  handleGetMemory,
  handleUpdateMemory,
  toResponse,
} from "@/features/memory/api/memory-handlers";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  return toResponse(await handleGetMemory(id));
}

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  return toResponse(await handleUpdateMemory(id, body));
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  return toResponse(await handleDeleteMemory(id));
}
