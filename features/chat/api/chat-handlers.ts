import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";
import { chatBodySchema } from "@/features/chat/api/chat-schemas";
import {
  finalizeChatTurn,
  prepareChatTurn,
} from "@/features/chat/use-cases/send-chat-message";

type HandlerResult =
  | { ok: true; stream: ReadableStream<Uint8Array> }
  | { ok: false; status: number; body: { error: string } };

function encodeSse(event: string, data: unknown): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function handleChatStream(body: unknown): Promise<HandlerResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, status: 401, body: { error: "unauthorized" } };
  }

  const parsed = chatBodySchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, status: 400, body: { error: "validation failed" } };
  }

  const { workspaceId } = await ensureWorkspace(session.user.id);
  const projectId =
    parsed.data.projectId === "global"
      ? null
      : parsed.data.projectId === undefined
        ? undefined
        : parsed.data.projectId;

  let prepared;
  try {
    prepared = await prepareChatTurn({
      workspaceId,
      userId: session.user.id,
      message: parsed.data.message,
      conversationId: parsed.data.conversationId,
      projectId,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message === "conversation not found"
        ? "conversation not found"
        : "chat preparation failed";
    const status = message === "conversation not found" ? 404 : 500;
    return { ok: false, status, body: { error: message } };
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let assistantText = "";

      try {
        for await (const chunk of prepared.stream) {
          assistantText += chunk;
          controller.enqueue(encodeSse("token", { text: chunk }));
        }

        const finalized = await finalizeChatTurn({
          prepared,
          assistantText,
        });

        controller.enqueue(
          encodeSse("metadata", {
            conversationId: finalized.conversationId,
            assistantMessageId: finalized.assistantMessageId,
            citations: finalized.citations,
          }),
        );
        controller.enqueue(encodeSse("done", {}));
      } catch {
        controller.enqueue(
          encodeSse("error", { error: "generation failed" }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return { ok: true, stream };
}
