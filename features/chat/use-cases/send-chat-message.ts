import {
  orchestratorBuildPrompt,
  orchestratorEmbed,
  orchestratorGenerate,
  orchestratorRetrieve,
  type OrchestratorContext,
} from "@/ai/orchestrator";
import type { ChatCitation } from "@/ai/types";
import { enqueueColdExtraction } from "@/features/chat/use-cases/enqueue-cold-extraction";
import {
  createConversation,
  createMessage,
  getConversation,
  listRecentMessages,
  touchConversation,
} from "@/repositories/conversations";
import { listPinnedOrImportantMemories } from "@/repositories/memories";
import { listOpenTasks } from "@/repositories/tasks";

export type SendChatMessageInput = {
  workspaceId: string;
  userId: string;
  message: string;
  conversationId?: string;
  projectId?: string | null;
};

export type PreparedChatTurn = {
  ctx: OrchestratorContext;
  conversationId: string;
  userMessageId: string;
  citations: ChatCitation[];
  stream: AsyncGenerator<string>;
};

export async function prepareChatTurn(
  input: SendChatMessageInput,
): Promise<PreparedChatTurn> {
  let conversationId = input.conversationId;

  if (conversationId) {
    const existing = await getConversation(input.workspaceId, conversationId);
    if (!existing) {
      throw new Error("conversation not found");
    }
  } else {
    const created = await createConversation({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      title: input.message.slice(0, 80),
    });
    conversationId = created.id;
  }

  const ctx: OrchestratorContext = {
    workspaceId: input.workspaceId,
    userId: input.userId,
    projectId: input.projectId,
    conversationId,
  };

  const userMessage = await createMessage({
    conversationId,
    role: "user",
    content: input.message,
  });

  const [embedded, recentMessages, pinnedMemories, openTasks] =
    await Promise.all([
      orchestratorEmbed(ctx, input.message),
      listRecentMessages(conversationId, 8),
      listPinnedOrImportantMemories({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        limit: 5,
      }),
      listOpenTasks({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        limit: 5,
      }),
    ]);

  const retrieved = await orchestratorRetrieve(ctx, embedded.vector, {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    limit: 8,
  });

  const prompt = await orchestratorBuildPrompt({
    retrievedMemories: retrieved.items,
    pinnedMemories,
    openTasks,
    recentMessages: recentMessages.filter(
      (message) => message.id !== userMessage.id,
    ),
    userMessage: input.message,
  });

  return {
    ctx,
    conversationId,
    userMessageId: userMessage.id,
    citations: prompt.citations,
    stream: orchestratorGenerate(ctx, prompt),
  };
}

export async function finalizeChatTurn(input: {
  prepared: PreparedChatTurn;
  assistantText: string;
}) {
  const assistantMessage = await createMessage({
    conversationId: input.prepared.conversationId,
    role: "assistant",
    content: input.assistantText,
  });

  await touchConversation(input.prepared.conversationId);

  enqueueColdExtraction(input.prepared.ctx, {
    conversationId: input.prepared.conversationId,
    userMessageId: input.prepared.userMessageId,
    assistantMessageId: assistantMessage.id,
  });

  return {
    assistantMessageId: assistantMessage.id,
    conversationId: input.prepared.conversationId,
    citations: input.prepared.citations,
  };
}
