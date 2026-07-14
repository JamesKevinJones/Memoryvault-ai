import {
  handleCreateTask,
  handleListTasks,
  toResponse,
} from "@/features/tasks/api/task-handlers";

export async function GET(req: Request) {
  const url = new URL(req.url);
  return toResponse(await handleListTasks(url.searchParams));
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  return toResponse(await handleCreateTask(body));
}
