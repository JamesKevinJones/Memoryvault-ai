import { consumeRateLimit } from "@/repositories/rate-limits";

/**
 * Budgets are per user per window, and deliberately tightest where a request
 * costs the most. Chat is two model calls plus an async extraction; search and
 * memory writes are one embedding each; the ops sweep is bounded work but
 * touches the queue.
 */
export const RATE_LIMITS = {
  chat: { limit: 20, windowMs: 60_000 },
  search: { limit: 60, windowMs: 60_000 },
  memoryWrite: { limit: 60, windowMs: 60_000 },
  ops: { limit: 10, windowMs: 60_000 },
} as const;

export type RateLimitName = keyof typeof RATE_LIMITS;

export type RateLimitOutcome =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number; resetAt: Date };

export async function checkRateLimit(
  name: RateLimitName,
  subjectId: string,
): Promise<RateLimitOutcome> {
  const policy = RATE_LIMITS[name];

  let decision;
  try {
    decision = await consumeRateLimit({
      key: `${name}:${subjectId}`,
      limit: policy.limit,
      windowMs: policy.windowMs,
    });
  } catch (err) {
    // Fail open, loudly. Every endpoint this guards needs the same database to
    // do its actual work, so a counter that cannot be read means the request
    // was going to fail anyway — refusing here would only convert a database
    // blip into a second, more confusing outage. It must not be silent.
    console.error("[rate-limit] counter unavailable, allowing request", {
      limit: name,
      error: err instanceof Error ? err.message : "unknown error",
    });
    return { allowed: true };
  }

  if (decision.allowed) return { allowed: true };
  return {
    allowed: false,
    retryAfterSeconds: decision.retryAfterSeconds,
    resetAt: decision.resetAt,
  };
}

export function rateLimitedResponse(outcome: {
  retryAfterSeconds: number;
  resetAt: Date;
}): Response {
  return Response.json(
    { error: "rate limited", retryAfterSeconds: outcome.retryAfterSeconds },
    {
      status: 429,
      headers: {
        "Retry-After": String(outcome.retryAfterSeconds),
        "X-RateLimit-Reset": outcome.resetAt.toISOString(),
      },
    },
  );
}
