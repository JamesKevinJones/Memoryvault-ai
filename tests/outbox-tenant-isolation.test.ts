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

/**
 * Regression cover for the cross-tenant outbox bug: the ops route authenticated
 * the caller and then dispatched the entire embedding_outbox table, so any
 * signed-in user processed — and burned the retry budget of — every other
 * workspace's jobs. The dispatcher must never reach the database without an
 * explicit scope.
 */
describe("embed outbox tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("restricts the claimable query to the caller's workspace", async () => {
    const { listClaimableEmbedOutboxJobs } = await import(
      "@/repositories/embedding-outbox"
    );
    const { dispatchPendingEmbedJobs } = await import(
      "@/features/memory/use-cases/enqueue-embed-retry"
    );

    vi.mocked(listClaimableEmbedOutboxJobs).mockResolvedValue([]);

    await dispatchPendingEmbedJobs({ workspaceId: "ws-alice" });

    expect(listClaimableEmbedOutboxJobs).toHaveBeenCalledWith(
      { workspaceId: "ws-alice" },
      10,
    );
    expect(listClaimableEmbedOutboxJobs).not.toHaveBeenCalledWith(
      expect.objectContaining({ allWorkspaces: true }),
      expect.anything(),
    );
  });

  it("passes the unscoped sweep through only when explicitly asked", async () => {
    const { listClaimableEmbedOutboxJobs } = await import(
      "@/repositories/embedding-outbox"
    );
    const { dispatchPendingEmbedJobs } = await import(
      "@/features/memory/use-cases/enqueue-embed-retry"
    );

    vi.mocked(listClaimableEmbedOutboxJobs).mockResolvedValue([]);

    await dispatchPendingEmbedJobs({ allWorkspaces: true });

    expect(listClaimableEmbedOutboxJobs).toHaveBeenCalledWith(
      { allWorkspaces: true },
      10,
    );
  });

  it("forwards the scope to the claim so a leaked job id is still not claimable", async () => {
    const { claimEmbedOutboxJob } = await import(
      "@/repositories/embedding-outbox"
    );
    const { processEmbedOutboxJob } = await import(
      "@/features/memory/use-cases/enqueue-embed-retry"
    );

    vi.mocked(claimEmbedOutboxJob).mockResolvedValue(null as never);

    const result = await processEmbedOutboxJob("job-owned-by-bob", {
      workspaceId: "ws-alice",
    });

    expect(claimEmbedOutboxJob).toHaveBeenCalledWith("job-owned-by-bob", {
      workspaceId: "ws-alice",
    });
    expect(result).toEqual({ ok: false, reason: "claim_failed" });
  });
});
