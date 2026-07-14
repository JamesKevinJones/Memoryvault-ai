import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  parseSearchQuery,
  searchQuerySchema,
} from "@/features/search/api/search-handlers";
import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/features/auth/use-cases/ensure-workspace", () => ({
  ensureWorkspace: vi.fn(),
}));

vi.mock("@/ai/orchestrator", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/ai/orchestrator")>();
  return {
    ...actual,
    orchestratorEmbed: vi.fn(),
    orchestratorRetrieve: vi.fn(),
  };
});

describe("search API validation", () => {
  it("accepts valid search query params", () => {
    const params = new URLSearchParams({
      q: "deployment notes",
      projectId: "global",
      category: "fact",
      limit: "5",
    });
    const parsed = parseSearchQuery(params);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data).toEqual({
        q: "deployment notes",
        projectId: "global",
        category: "fact",
        limit: 5,
      });
    }
  });

  it("rejects empty query", () => {
    expect(searchQuerySchema.safeParse({ q: "   " }).success).toBe(false);
    expect(parseSearchQuery(new URLSearchParams()).ok).toBe(false);
  });
});

describe("GET /api/v1/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for missing query", async () => {
    const { GET } = await import("@/app/api/v1/search/route");
    const res = await GET(new Request("http://localhost/api/v1/search"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "validation failed" });
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const { GET } = await import("@/app/api/v1/search/route");
    const res = await GET(
      new Request("http://localhost/api/v1/search?q=notes"),
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("returns semantic search results when authenticated", async () => {
    const { orchestratorEmbed, orchestratorRetrieve } = await import(
      "@/ai/orchestrator"
    );
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
      expires: new Date(Date.now() + 86_400_000).toISOString(),
    } as never);
    vi.mocked(ensureWorkspace).mockResolvedValue({
      workspaceId: "ws-1",
      name: "My Vault",
    });
    vi.mocked(orchestratorEmbed).mockResolvedValue({
      vector: [0.1, 0.2],
      modelId: "amazon.titan-embed-text-v2:0",
      dimensions: 1024,
    });
    vi.mocked(orchestratorRetrieve).mockResolvedValue({
      items: [
        {
          memoryId: "mem-1",
          title: "Deploy",
          content: "Use staging first",
          category: "fact",
          importance: 50,
          projectId: null,
          score: 0.92,
        },
      ],
      retrievalCount: 1,
    });

    const { GET } = await import("@/app/api/v1/search/route");
    const res = await GET(
      new Request("http://localhost/api/v1/search?q=deploy"),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].memoryId).toBe("mem-1");
    expect(body.retrievalCount).toBe(1);
    expect(typeof body.latencyMs).toBe("number");
  });
});