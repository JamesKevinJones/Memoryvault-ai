import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/db/client", () => ({
  db: {
    execute: vi.fn(),
  },
}));

describe("GET /api/v1/health", () => {
  beforeEach(async () => {
    const { db } = await import("@/db/client");
    vi.mocked(db.execute).mockReset();
  });

  it("returns ok when db ping succeeds", async () => {
    const { db } = await import("@/db/client");
    vi.mocked(db.execute).mockResolvedValue(undefined as never);

    const { GET } = await import("@/app/api/v1/health/route");
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ status: "ok", db: "up" });
  });

  it("returns degraded when db ping fails", async () => {
    const { db } = await import("@/db/client");
    vi.mocked(db.execute).mockRejectedValue(new Error("connection refused"));

    const { GET } = await import("@/app/api/v1/health/route");
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body).toEqual({ status: "degraded", db: "down" });
  });
});
