import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/repositories/embedding-outbox", () => ({
  claimEmbedOutboxJob: vi.fn(),
  markEmbedOutboxCompleted: vi.fn(),
  markEmbedOutboxFailed: vi.fn(),
  markEmbedOutboxDiscarded: vi.fn(),
  listClaimableEmbedOutboxJobs: vi.fn(),
}));

vi.mock("@/repositories/memories", () => ({
  getMemoryById: vi.fn(),
}));

vi.mock("@/features/memory/use-cases/embed-memory", () => ({
  embedMemoryForUser: vi.fn(),
}));

vi.mock("next/server", () => ({
  after: (fn: () => Promise<void>) => {
    void fn();
  },
}));

describe("processEmbedOutboxJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("claims before embed, uses live memory, and completes with claim token", async () => {
    const {
      claimEmbedOutboxJob,
      markEmbedOutboxCompleted,
      markEmbedOutboxFailed,
    } = await import("@/repositories/embedding-outbox");
    const { getMemoryById } = await import("@/repositories/memories");
    const { embedMemoryForUser } = await import(
      "@/features/memory/use-cases/embed-memory"
    );
    const { processEmbedOutboxJob } = await import(
      "@/features/memory/use-cases/enqueue-embed-retry"
    );

    vi.mocked(claimEmbedOutboxJob).mockResolvedValue({
      id: "job-1",
      workspaceId: "ws-1",
      userId: "user-1",
      memoryId: "mem-1",
      projectId: null,
      operation: "create",
      title: "stale title",
      content: "stale content",
      status: "processing",
      attempts: 1,
      claimToken: "claim-1",
      claimedAt: new Date(),
      nextAttemptAt: null,
      lastError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(getMemoryById).mockResolvedValue({
      id: "mem-1",
      workspaceId: "ws-1",
      projectId: null,
      category: "note",
      title: "live title",
      content: "live content",
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
    });
    vi.mocked(embedMemoryForUser).mockResolvedValue(undefined);

    const result = await processEmbedOutboxJob("job-1");

    expect(result).toEqual({ ok: true });
    expect(embedMemoryForUser).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      userId: "user-1",
      memoryId: "mem-1",
      title: "live title",
      content: "live content",
      projectId: null,
    });
    expect(markEmbedOutboxCompleted).toHaveBeenCalledWith("job-1", "claim-1");
    expect(markEmbedOutboxFailed).not.toHaveBeenCalled();
  });

  it("discards missing memory jobs without embedding", async () => {
    const { claimEmbedOutboxJob, markEmbedOutboxDiscarded } = await import(
      "@/repositories/embedding-outbox"
    );
    const { getMemoryById } = await import("@/repositories/memories");
    const { embedMemoryForUser } = await import(
      "@/features/memory/use-cases/embed-memory"
    );
    const { processEmbedOutboxJob } = await import(
      "@/features/memory/use-cases/enqueue-embed-retry"
    );

    vi.mocked(claimEmbedOutboxJob).mockResolvedValue({
      id: "job-1",
      workspaceId: "ws-1",
      userId: "user-1",
      memoryId: "mem-missing",
      projectId: null,
      operation: "update",
      title: "gone",
      content: "gone",
      status: "processing",
      attempts: 1,
      claimToken: "claim-1",
      claimedAt: new Date(),
      nextAttemptAt: null,
      lastError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(getMemoryById).mockResolvedValue(null);

    const result = await processEmbedOutboxJob("job-1");

    expect(result).toEqual({ ok: false, reason: "memory_missing" });
    expect(embedMemoryForUser).not.toHaveBeenCalled();
    expect(markEmbedOutboxDiscarded).toHaveBeenCalledWith(
      "job-1",
      "claim-1",
      "memory missing; discarding embed job",
    );
  });

  it("exits when claim fails", async () => {
    const { claimEmbedOutboxJob } = await import(
      "@/repositories/embedding-outbox"
    );
    const { embedMemoryForUser } = await import(
      "@/features/memory/use-cases/embed-memory"
    );
    const { processEmbedOutboxJob } = await import(
      "@/features/memory/use-cases/enqueue-embed-retry"
    );

    vi.mocked(claimEmbedOutboxJob).mockResolvedValue(null as never);

    const result = await processEmbedOutboxJob("job-1");

    expect(result).toEqual({ ok: false, reason: "claim_failed" });
    expect(embedMemoryForUser).not.toHaveBeenCalled();
  });
});
