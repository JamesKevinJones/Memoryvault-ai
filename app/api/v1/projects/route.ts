import {
  handleCreateProject,
  handleListProjects,
  toResponse,
} from "@/features/projects/api/project-handlers";

export async function GET() {
  return toResponse(await handleListProjects());
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  return toResponse(await handleCreateProject(body));
}
