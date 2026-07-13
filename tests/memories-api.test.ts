import { describe, expect, it, vi } from "vitest";
import {
  createMemoryBodySchema,
  listMemoriesQuerySchema,
  parseListMemoriesQuery,
  updateMemoryBodySchema,
} from "@/features/memory/api/memory-schemas";
import { parseMemoryListCursor } from "@/repositories/memories";

vi.mock("@/features/memory/api/memory-handlers", () => ({
  handleCreateMemory: vi.fn(),
  handleListMemories: vi.fn(),
  handleGetMemory: vi.fn(),
  handleUpdateMemory: vi.fn(),
  handleDeleteMemory: vi.fn(),
  handleListRelatedMemories: vi.fn(),
  toResponse: vi.fn(),
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
