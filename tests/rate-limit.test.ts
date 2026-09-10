import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/repositories/rate-limits", () => ({
  consumeRateLimit: vi.fn(),
  purgeExpiredRateLimits: vi.fn(),
}));

describe("rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows a request inside the budget and blocks the one past it", async () => {
    const { consumeRateLimit } = await import("@/repositories/rate-limits");
    const { checkRateLimit, RATE_LIMITS } = await import("@/lib/rate-limit");

    const resetAt = new Date("2026-01-01T00:01:00.000Z");

    vi.mocked(consumeRateLimit).mockResolvedValueOnce({
      allowed: true,
      hits: RATE_LIMITS.chat.limit,
      limit: RATE_LIMITS.chat.limit,
      resetAt,
      retryAfterSeconds: 30,
    });
    await expect(checkRateLimit("chat", "user-1")).resolves.toEqual({
      allowed: true,
    });

    vi.mocked(consumeRateLimit).mockResolvedValueOnce({
      allowed: false,
      hits: RATE_LIMITS.chat.limit + 1,
      limit: RATE_LIMITS.chat.limit,
      resetAt,
      retryAfterSeconds: 30,
    });
    await expect(checkRateLimit("chat", "user-1")).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 30,
      resetAt,
    });
  });

  it("keys the counter per user and per limit, so one caller cannot spend another's budget", async () => {
    const { consumeRateLimit } = await import("@/repositories/rate-limits");
    const { checkRateLimit } = await import("@/lib/rate-limit");

    vi.mocked(consumeRateLimit).mockResolvedValue({
      allowed: true,
      hits: 1,
      limit: 20,
      resetAt: new Date(),
      retryAfterSeconds: 1,
    });

    await checkRateLimit("chat", "user-a");
    await checkRateLimit("search", "user-b");

    expect(consumeRateLimit).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ key: "chat:user-a" }),
    );
    expect(consumeRateLimit).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ key: "search:user-b" }),
    );
  });

  it("fails open when the counter store is unreachable, rather than adding an outage", async () => {
    const { consumeRateLimit } = await import("@/repositories/rate-limits");
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(consumeRateLimit).mockRejectedValueOnce(
      new Error("connect ECONNREFUSED"),
    );

    await expect(checkRateLimit("chat", "user-1")).resolves.toEqual({
      allowed: true,
    });
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it("returns 429 with Retry-After", async () => {
    const { rateLimitedResponse } = await import("@/lib/rate-limit");
    const res = rateLimitedResponse({
      retryAfterSeconds: 42,
      resetAt: new Date("2026-01-01T00:00:42.000Z"),
    });

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("42");
    expect(res.headers.get("X-RateLimit-Reset")).toBe(
      "2026-01-01T00:00:42.000Z",
    );
  });
});
