import {
  getWorkspace,
  updateWorkspaceName,
} from "@/features/auth/api/workspace-handlers";

export async function GET() {
  const ws = await getWorkspace();
  if (!ws) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json({ id: ws.id, name: ws.name });
}

export async function PATCH(req: Request) {
  let body: { name?: string };
  try {
    body = (await req.json()) as { name?: string };
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body.name || body.name.trim().length < 1) {
    return Response.json({ error: "name required" }, { status: 400 });
  }
  const ws = await updateWorkspaceName(body.name.trim());
  if (!ws) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json({ id: ws.id, name: ws.name });
}
