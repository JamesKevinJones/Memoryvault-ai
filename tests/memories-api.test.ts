import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createMemoryBodySchema,
  listMemoriesQuerySchema,
  parseListMemoriesQuery,
  updateMemoryBodySchema,
} from "@/features/memory/api/memory-schemas";
import { parseMemoryListCursor } from "@/repositories/memories";
import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/features/auth/use-cases/ensure-workspace", () => ({
  ensureWorkspace: vi.fn(),
}));

describe("memory API validation", () => {
  it("accepts valid list query params", () => {
    const params = new URLSearchParams({
      projectId: "global",
      category: "fact",
      importance: "50",
      q: "deploy",
      cursor: "2026-07-13T12:00:00.000Z",
      limit: "10",
    });
    const parsed = parseListMemoriesQuery(params);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data).toEqual({
        projectId: "global",
        category: "fact",
        importance: 50,
        q: "deploy",
        cursor: "2026-07-13T12:00:00.000Z",
        limit: 10,
      });
    }
  });

  it("rejects invalid list query params", () => {
    const params = new URLSearchParams({ category: "invalid" });
    expect(parseListMemoriesQuery(params).ok).toBe(false);
    expect(
      listMemoriesQuerySchema.safeParse({ importance: "high" }).success,
    ).toBe(false);
  });

  it("rejects invalid create body", () => {
    expect(
      createMemoryBodySchema.safeParse({
        category: "note",
        title: "",
        content: "x",
      }).success,
    ).toBe(false);
  });

  it("rejects empty update body", () => {
    expect(updateMemoryBodySchema.safeParse({}).success).toBe(false);
  });

  it("ignores invalid cursor ISO in repository helper", () => {
    expect(parseMemoryListCursor("not-a-date")).toBeUndefined();
    expect(parseMemoryListCursor("2026-07-13T12:00:00.000Z")?.toISOString()).toBe(
      "2026-07-13T12:00:00.000Z",
    );
  });
});

describe("POST /api/v1/memories", () => {
  it("returns 400 for malformed JSON", async () => {
    const { POST } = await import("@/app/api/v1/memories/route");
    const req = new Request("http://localhost/api/v1/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid json" });
  });
});

describe("PATCH /api/v1/memories/[id]", () => {
  it("returns 400 for malformed JSON", async () => {
    const { PATCH } = await import("@/app/api/v1/memories/[id]/route");
    const req = new Request("http://localhost/api/v1/memories/mem-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "mem-1" }) });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid json" });
  });
});

describe("memory API unauthorized", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(null as never);
  });

  it("GET /api/v1/memories returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/v1/memories/route");
    const req = new Request("http://localhost/api/v1/memories");
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("GET /api/v1/memories/[id] returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/v1/memories/[id]/route");
    const req = new Request("http://localhost/api/v1/memories/mem-1");
    const res = await GET(req, { params: Promise.resolve({ id: "mem-1" }) });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });
});

describe("memory API handler validation", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", workspaceId: "ws-1" },
      expires: new Date(Date.now() + 86_400_000).toISOString(),
    } as never);
    vi.mocked(ensureWorkspace).mockResolvedValue({
      workspaceId: "ws-1",
      name: "My Vault",
    });
  });

  it("handleListMemories returns 400 for invalid query params", async () => {
    const { handleListMemories } = await import(
      "@/features/memory/api/memory-handlers"
    );
    const result = await handleListMemories(
      new URLSearchParams({ category: "invalid" }),
    );
    expect(result).toEqual({
      ok: false,
      status: 400,
      body: { error: "validation failed" },
    });
  });
});
