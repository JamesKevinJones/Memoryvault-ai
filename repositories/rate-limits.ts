import { lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { rateLimits } from "@/db/schema";

export type RateLimitDecision = {
  allowed: boolean;
  hits: number;
  limit: number;
  resetAt: Date;
  retryAfterSeconds: number;
};

/**
 * Count one request against a fixed window and say whether it may proceed.
 *
 * One atomic upsert, so concurrent requests from the same caller cannot both
 * read a stale count and both pass. Fixed windows allow a burst across a
 * boundary; that is an accepted trade for a single round trip and no extra
 * infrastructure. It is a spend and abuse control, not a fairness scheduler.
 */
export async function consumeRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitDecision> {
  const now = Date.now();
  const windowStart = new Date(now - (now % input.windowMs));
  const resetAt = new Date(windowStart.getTime() + input.windowMs);

  const [row] = await db
    .insert(rateLimits)
    .values({
      bucketKey: input.key,
      windowStart,
      hits: 1,
      updatedAt: new Date(now),
    })
    .onConflictDoUpdate({
      target: [rateLimits.bucketKey, rateLimits.windowStart],
      set: {
        hits: sql`${rateLimits.hits} + 1`,
        updatedAt: new Date(now),
      },
    })
    .returning({ hits: rateLimits.hits });

  const hits = row?.hits ?? 1;

  return {
    allowed: hits <= input.limit,
    hits,
    limit: input.limit,
    resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((resetAt.getTime() - now) / 1000)),
  };
}

/** Drop windows that can no longer be consulted. Called from the ops cron. */
export async function purgeExpiredRateLimits(olderThanMs = 24 * 60 * 60 * 1000) {
  const cutoff = new Date(Date.now() - olderThanMs);
  const deleted = await db
    .delete(rateLimits)
    .where(lt(rateLimits.windowStart, cutoff))
    .returning({ bucketKey: rateLimits.bucketKey });
  return deleted.length;
}
