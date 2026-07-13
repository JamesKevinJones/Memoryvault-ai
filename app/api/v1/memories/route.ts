import {
  handleCreateMemory,
  handleListMemories,
  toResponse,
} from "@/features/memory/api/memory-handlers";

export async function GET(req: Request) {
  const url = new URL(req.url);
  return toResponse(await handleListMemories(url.searchParams));
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  return toResponse(await handleCreateMemory(body));
}
