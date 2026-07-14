import { handleChatStream } from "@/features/chat/api/chat-handlers";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const result = await handleChatStream(body);
  if (!result.ok) {
    return Response.json(result.body, { status: result.status });
  }

  return new Response(result.stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
