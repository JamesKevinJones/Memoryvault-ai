import { requireAuth } from "@/lib/session";
import { describeError, logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { isProjectInWorkspace } from "@/features/projects/use-cases/verify-project-access";
import { chatBodySchema } from "@/features/chat/api/chat-schemas";
import {
  finalizeChatTurn,
  prepareChatTurn,
} from "@/features/chat/use-cases/send-chat-message";

type HandlerResult =
  | { ok: true; stream: ReadableStream<Uint8Array> }
  | { ok: false; status: number; body: { error: string }; retryAfterSeconds?: number };

function encodeSse(event: string, data: unknown): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function handleChatStream(body: unknown): Promise<HandlerResult> {
  const ctx = await requireAuth();
  if (!ctx) {
    return { ok: false, status: 401, body: { error: "unauthorized" } };
  }

  // A chat turn is two Bedrock calls plus an async extraction, so this is
  // the most expensive thing an authenticated caller can loop on.
  const rate = await checkRateLimit("chat", ctx.userId);
  if (!rate.allowed) {
    return {
      ok: false,
      status: 429,
      body: { error: "rate limited" },
      retryAfterSeconds: rate.retryAfterSeconds,
    };
  }
  const parsed = chatBodySchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, status: 400, body: { error: "validation failed" } };
  }

  const projectId =
    parsed.data.projectId === "global"
      ? null
      : parsed.data.projectId === undefined
        ? undefined
        : parsed.data.projectId;

  // Scoping a conversation to another workspace's project would leak that
  // project id into retrieval scope and into every memory the cold path
  // then writes for this turn.
  if (!(await isProjectInWorkspace(ctx.workspaceId, projectId))) {
    return { ok: false, status: 404, body: { error: "not found" } };
  }

  let prepared;
  try {
    prepared = await prepareChatTurn({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
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
      } catch (err) {
        logger.error("chat stream failed mid-generation", {
          conversationId: prepared.conversationId,
          error: describeError(err),
        });
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
