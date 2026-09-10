import { index, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Fixed-window counters, kept in Postgres rather than memory.
 *
 * An in-process limiter is worthless here: every Vercel instance would keep
 * its own count, so the effective limit is (limit x instances) and resets on
 * every cold start. The database is the only state all instances share, and
 * one upsert per limited request is cheap next to the Bedrock call it guards.
 */
export const rateLimits = pgTable(
  "rate_limits",
  {
    bucketKey: text("bucket_key").notNull(),
    windowStart: timestamp("window_start", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    hits: integer("hits").notNull().default(0),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.bucketKey, t.windowStart] }),
    index("rate_limits_window_start_idx").on(t.windowStart),
  ],
);
