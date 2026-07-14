import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/ai/orchestrator", () => ({
  orchestratorExtractMemories: vi.fn(),
  orchestratorEmbed: vi.fn(),
  orchestratorEmbedMemory: vi.fn(),
}));

vi.mock("@/repositories/conversations", () => ({
  getMessageById: vi.fn(),
  getConversation: vi.fn(),
}));

vi.mock("@/repositories/embeddings", () => ({
  searchMemoriesByVector: vi.fn(),
}));

vi.mock("@/repositories/memories", () => ({
  createMemory: vi.fn(),
  updateMemory: vi.fn(),
}));

vi.mock("@/repositories/memory-links", () => ({
  upsertMemoryLink: vi.fn(),
}));

vi.mock("@/repositories/tasks", () => ({
  createTask: vi.fn(),
}));

describe("runColdExtraction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts, dedupes, and upserts memories and tasks", async () => {
    const {
      orchestratorExtractMemories,
      orchestratorEmbed,
      orchestratorEmbedMemory,
    } = await import("@/ai/orchestrator");
    const { getMessageById, getConversation } = await import(
      "@/repositories/conversations"
    );
    const { searchMemoriesByVector } = await import(
      "@/repositories/embeddings"
    );
    const { createMemory } = await import("@/repositories/memories");
    const { createTask } = await import("@/repositories/tasks");
    const { runColdExtraction } = await import(
      "@/features/chat/use-cases/run-cold-extraction"
    );

    vi.mocked(getMessageById).mockImplementation(async (id) => {
      if (id === "user-1") {
        return {
          id: "user-1",
          conversationId: "conv-1",
          role: "user",
          content: "I deploy on Fridays",
          createdAt: new Date(),
        };
      }
      return {
        id: "asst-1",
        conversationId: "conv-1",
        role: "assistant",
        content: "Noted your deploy schedule.",
        createdAt: new Date(),
      };
    });

    vi.mocked(getConversation).mockResolvedValue({
      id: "conv-1",
      workspaceId: "ws-1",
      projectId: null,
      title: "Chat",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(orchestratorExtractMemories).mockResolvedValue({
      memories: [
        {
          title: "Deploy schedule",
          content: "User deploys on Fridays.",
          category: "fact",
          importance: 70,
        },
      ],
      tasks: [{ title: "Review Friday deploy checklist" }],
    });

    vi.mocked(orchestratorEmbed).mockResolvedValue({
      vector: [0.1, 0.2],
      modelId: "amazon.titan-embed-text-v2:0",
      dimensions: 1024,
    });
    vi.mocked(searchMemoriesByVector).mockResolvedValue([]);
    vi.mocked(createMemory).mockResolvedValue({
      id: "mem-new",
      workspaceId: "ws-1",
      projectId: null,
      category: "fact",
      title: "Deploy schedule",
      content: "User deploys on Fridays.",
      summary: null,
      importance: 70,
      pinned: false,
      sourceConversationId: "conv-1",
      sourceMessageId: "asst-1",
      sourceDocumentId: null,
      sourceTaskId: null,
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: null,
    });
    vi.mocked(orchestratorEmbedMemory).mockResolvedValue(undefined);
    vi.mocked(createTask).mockResolvedValue({
      id: "task-1",
      workspaceId: "ws-1",
      projectId: null,
      title: "Review Friday deploy checklist",
      status: "open",
      dueAt: null,
      memoryId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await runColdExtraction(
      {
        workspaceId: "ws-1",
        userId: "user-1",
        conversationId: "conv-1",
      },
      {
        conversationId: "conv-1",
        userMessageId: "user-1",
        assistantMessageId: "asst-1",
      },
    );

    expect(result.memoryIds).toEqual(["mem-new"]);
    expect(result.taskIds).toEqual(["task-1"]);
    expect(orchestratorExtractMemories).toHaveBeenCalledOnce();
    expect(createMemory).toHaveBeenCalledOnce();
    expect(createTask).toHaveBeenCalledOnce();
  });
});
