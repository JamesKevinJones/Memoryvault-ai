import { describe, expect, it } from "vitest";
import { buildChatPrompt } from "@/ai/prompts/chat";

describe("buildChatPrompt", () => {
  it("assembles system context, history, and citations", async () => {
    const pack = buildChatPrompt({
      retrievedMemories: [
        {
          memoryId: "mem-1",
          title: "Deploy flow",
          content: "Always deploy to staging first.",
          category: "fact",
          importance: 60,
          projectId: null,
          score: 0.88,
        },
      ],
      pinnedMemories: [
        {
          id: "mem-2",
          workspaceId: "ws-1",
          projectId: null,
          category: "preference",
          title: "Tone",
          content: "Keep answers concise.",
          summary: null,
          importance: 90,
          pinned: true,
          sourceConversationId: null,
          sourceMessageId: null,
          sourceDocumentId: null,
          sourceTaskId: null,
          archivedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastAccessedAt: null,
        },
      ],
      openTasks: [
        {
          id: "task-1",
          workspaceId: "ws-1",
          projectId: null,
          title: "Review PR",
          status: "open",
          dueAt: null,
          memoryId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      recentMessages: [
        {
          id: "msg-1",
          conversationId: "conv-1",
          role: "user",
          content: "Earlier question",
          createdAt: new Date(),
        },
      ],
      userMessage: "How should I deploy?",
    });

    expect(pack.system).toContain("Deploy flow");
    expect(pack.system).toContain("Review PR");
    expect(pack.messages).toEqual([
      { role: "user", content: "Earlier question" },
      { role: "user", content: "How should I deploy?" },
    ]);
    expect(pack.citations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ memoryId: "mem-1", title: "Deploy flow" }),
        expect.objectContaining({ memoryId: "mem-2", title: "Tone" }),
      ]),
    );
  });
});
