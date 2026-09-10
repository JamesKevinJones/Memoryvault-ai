import { describe, expect, it, afterEach } from "vitest";
import { isTrustedCronRequest } from "@/lib/ops-auth";

const ORIGINAL = process.env.CRON_SECRET;

function request(headers: Record<string, string> = {}) {
  return new Request("https://example.com/api/v1/ops/embed-outbox", {
    method: "GET",
    headers,
  });
}

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = ORIGINAL;
});

/**
 * This gate is the only thing standing between a request and a sweep of every
 * tenant's queue, so its failure mode has to be "closed".
 */
describe("cron trust gate", () => {
  it("is closed when no secret is configured", () => {
    delete process.env.CRON_SECRET;
    expect(isTrustedCronRequest(request())).toBe(false);
    expect(
      isTrustedCronRequest(request({ authorization: "Bearer anything" })),
    ).toBe(false);
  });

  it("is closed when the configured secret is too short to be worth trusting", () => {
    process.env.CRON_SECRET = "short";
    expect(
      isTrustedCronRequest(request({ authorization: "Bearer short" })),
    ).toBe(false);
  });

  it("accepts only the exact secret", () => {
    process.env.CRON_SECRET = "a-sufficiently-long-cron-secret";
    expect(
      isTrustedCronRequest(
        request({ authorization: "Bearer a-sufficiently-long-cron-secret" }),
      ),
    ).toBe(true);
  });

  it("rejects a wrong secret, a missing header, and a missing Bearer prefix", () => {
    process.env.CRON_SECRET = "a-sufficiently-long-cron-secret";
    expect(isTrustedCronRequest(request())).toBe(false);
    expect(
      isTrustedCronRequest(
        request({ authorization: "a-sufficiently-long-cron-secret" }),
      ),
    ).toBe(false);
    expect(
      isTrustedCronRequest(
        request({ authorization: "Bearer a-sufficiently-long-cron-secreT" }),
      ),
    ).toBe(false);
    // A prefix of the real secret must not pass: unequal lengths short-circuit
    // before timingSafeEqual, which throws on mismatched buffers.
    expect(
      isTrustedCronRequest(request({ authorization: "Bearer a-suffic" })),
    ).toBe(false);
  });
});
