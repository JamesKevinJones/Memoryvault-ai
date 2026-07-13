import { describe, expect, it } from "vitest";
import { resolveMemoryListFilters } from "@/repositories/memories";

describe("resolveMemoryListFilters", () => {
  it("defaults limit and excludes archived", () => {
    const resolved = resolveMemoryListFilters({ workspaceId: "ws-1" });
    expect(resolved).toMatchObject({
      workspaceId: "ws-1",
      excludeArchived: true,
      projectScope: "any",
      limit: 20,
    });
    expect(resolved.keywordPattern).toBeUndefined();
  });

  it("builds ILIKE keyword pattern for q", () => {
    const resolved = resolveMemoryListFilters({
      workspaceId: "ws-1",
      q: "  deploy  ",
    });
    expect(resolved.keywordPattern).toBe("%deploy%");
  });

  it("applies category and minImportance filters", () => {
    const resolved = resolveMemoryListFilters({
      workspaceId: "ws-1",
      category: "fact",
      minImportance: 50,
    });
    expect(resolved.category).toBe("fact");
    expect(resolved.minImportance).toBe(50);
  });

  it("distinguishes global-only from any project scope", () => {
    expect(
      resolveMemoryListFilters({ workspaceId: "ws-1", projectId: null })
        .projectScope,
    ).toBe("global");
    expect(
      resolveMemoryListFilters({ workspaceId: "ws-1", projectId: "proj-1" })
        .projectScope,
    ).toEqual({ projectId: "proj-1" });
  });

  it("caps limit at 100", () => {
    expect(
      resolveMemoryListFilters({ workspaceId: "ws-1", limit: 500 }).limit,
    ).toBe(100);
  });

  it("parses cursor for keyset pagination", () => {
    const resolved = resolveMemoryListFilters({
      workspaceId: "ws-1",
      cursor: "2026-07-13T12:00:00.000Z",
    });
    expect(resolved.cursorDate?.toISOString()).toBe("2026-07-13T12:00:00.000Z");
  });

  it("applies pinned filter", () => {
    expect(
      resolveMemoryListFilters({ workspaceId: "ws-1", pinned: true }).pinned,
    ).toBe(true);
  });
});
