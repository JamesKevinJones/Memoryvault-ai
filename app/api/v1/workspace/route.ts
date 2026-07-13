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
  const body = (await req.json()) as { name?: string };
  if (!body.name || body.name.trim().length < 1) {
    return Response.json({ error: "name required" }, { status: 400 });
  }
  const ws = await updateWorkspaceName(body.name.trim());
  if (!ws) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json({ id: ws.id, name: ws.name });
}
