import { describe, expect, it, vi, beforeEach } from "vitest";
import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/features/auth/use-cases/ensure-workspace", () => ({
  ensureWorkspace: vi.fn(),
}));

vi.mock("@/features/memory/use-cases/persist-memory-with-embed-event", () => ({
  createMemoryWithEmbedEvent: vi.fn(),
  updateMemoryWithEmbedEvent: vi.fn(),
}));

vi.mock("@/features/memory/use-cases/update-memory", () => ({
  updateMemoryUseCase: vi.fn(),
}));

vi.mock("@/features/memory/use-cases/embed-memory", () => ({
  embedMemoryForUser: vi.fn(),
}));

vi.mock("@/features/memory/use-cases/enqueue-embed-retry", () => ({
  completePendingEmbedEvent: vi.fn(),
  scheduleEmbedOutboxDispatch: vi.fn(),
  processEmbedOutboxJob: vi.fn(),
  dispatchPendingEmbedJobs: vi.fn(),
}));

describe("memory embedding outbox durability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
      expires: new Date(Date.now() + 86_400_000).toISOString(),
    } as never);
    vi.mocked(ensureWorkspace).mockResolvedValue({
      workspaceId: "ws-1",
      name: "My Vault",
    });
  });

  it("persists embed event with create and marks complete on successful embed", async () => {
    const { createMemoryWithEmbedEvent } = await import(
      "@/features/memory/use-cases/persist-memory-with-embed-event"
    );
    const { embedMemoryForUser } = await import(
      "@/features/memory/use-cases/embed-memory"
    );
    const { completePendingEmbedEvent, scheduleEmbedOutboxDispatch } =
      await import("@/features/memory/use-cases/enqueue-embed-retry");
    const { handleCreateMemory } = await import(
      "@/features/memory/api/memory-handlers"
    );

    const memory = {
      id: "mem-1",
      workspaceId: "ws-1",
      projectId: null,
      category: "note" as const,
      title: "Title",
      content: "Content",
      summary: null,
      importance: 0,
      pinned: false,
      sourceConversationId: null,
      sourceMessageId: null,
      sourceDocumentId: null,
      sourceTaskId: null,
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: null,
    };

    vi.mocked(createMemoryWithEmbedEvent).mockResolvedValue({
      memory,
      job: { id: "job-1" },
    } as never);
    vi.mocked(embedMemoryForUser).mockResolvedValue(undefined);
    vi.mocked(completePendingEmbedEvent).mockResolvedValue(undefined);

    const result = await handleCreateMemory({
      category: "note",
      title: "Title",
      content: "Content",
    });

    expect(result.ok).toBe(true);
    expect(createMemoryWithEmbedEvent).toHaveBeenCalledWith({
      userId: "user-1",
      memory: {
        workspaceId: "ws-1",
        category: "note",
        title: "Title",
        content: "Content",
      },
      operation: "create",
    });
    expect(completePendingEmbedEvent).toHaveBeenCalledWith("job-1");
    expect(scheduleEmbedOutboxDispatch).not.toHaveBeenCalled();
  });

  it("schedules durable dispatch when inline embed fails after create", async () => {
    const { createMemoryWithEmbedEvent } = await import(
      "@/features/memory/use-cases/persist-memory-with-embed-event"
    );
    const { embedMemoryForUser } = await import(
      "@/features/memory/use-cases/embed-memory"
    );
    const { completePendingEmbedEvent, scheduleEmbedOutboxDispatch } =
      await import("@/features/memory/use-cases/enqueue-embed-retry");
    const { handleCreateMemory } = await import(
      "@/features/memory/api/memory-handlers"
    );

    vi.mocked(createMemoryWithEmbedEvent).mockResolvedValue({
      memory: {
        id: "mem-1",
        workspaceId: "ws-1",
        projectId: null,
        category: "note",
        title: "Title",
        content: "Content",
        summary: null,
        importance: 0,
        pinned: false,
        sourceConversationId: null,
        sourceMessageId: null,
        sourceDocumentId: null,
        sourceTaskId: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastAccessedAt: null,
      },
      job: { id: "job-1" },
    } as never);
    vi.mocked(embedMemoryForUser).mockRejectedValue(
      new Error("Bedrock unavailable"),
    );

    const result = await handleCreateMemory({
      category: "note",
      title: "Title",
      content: "Content",
    });

    expect(result.ok).toBe(true);
    expect(completePendingEmbedEvent).not.toHaveBeenCalled();
    expect(scheduleEmbedOutboxDispatch).toHaveBeenCalledOnce();
  });

  it("persists update embed event atomically when title/content change", async () => {
    const { updateMemoryWithEmbedEvent } = await import(
      "@/features/memory/use-cases/persist-memory-with-embed-event"
    );
    const { embedMemoryForUser } = await import(
      "@/features/memory/use-cases/embed-memory"
    );
    const { completePendingEmbedEvent } = await import(
      "@/features/memory/use-cases/enqueue-embed-retry"
    );
    const { handleUpdateMemory } = await import(
      "@/features/memory/api/memory-handlers"
    );

    vi.mocked(updateMemoryWithEmbedEvent).mockResolvedValue({
      memory: {
        id: "mem-1",
        workspaceId: "ws-1",
        projectId: "proj-1",
        category: "fact",
        title: "Updated",
        content: "New content",
        summary: null,
        importance: 10,
        pinned: false,
        sourceConversationId: null,
        sourceMessageId: null,
        sourceDocumentId: null,
        sourceTaskId: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastAccessedAt: null,
      },
      job: { id: "job-2" },
    } as never);
    vi.mocked(embedMemoryForUser).mockResolvedValue(undefined);

    const result = await handleUpdateMemory("mem-1", {
      title: "Updated",
      content: "New content",
    });

    expect(result.ok).toBe(true);
    expect(updateMemoryWithEmbedEvent).toHaveBeenCalled();
    expect(completePendingEmbedEvent).toHaveBeenCalledWith("job-2");
  });
});
