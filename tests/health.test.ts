import { describe, expect, it } from "vitest";

describe("GET /api/v1/health", () => {
  it("returns ok payload shape from handler export", async () => {
    const { GET } = await import("@/app/api/v1/health/route");
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveProperty("status");
    expect(["ok", "degraded"]).toContain(body.status);
  });
});
