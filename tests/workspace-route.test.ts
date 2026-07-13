import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/api/workspace-handlers", () => ({
  getWorkspace: vi.fn(),
  updateWorkspaceName: vi.fn(),
}));

describe("PATCH /api/v1/workspace", () => {
  it("returns 400 for malformed JSON", async () => {
    const { PATCH } = await import("@/app/api/v1/workspace/route");
    const req = new Request("http://localhost/api/v1/workspace", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "invalid json" });
  });
});
