import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * `max` is per process, not per deployment. On Vercel each concurrent lambda
 * gets its own pool, so a generous number here multiplies by instance count
 * and exhausts CockroachDB's connection limit under fan-out. Keep it small and
 * let the platform scale horizontally.
 *
 * `prepare: false` is required: CockroachDB and connection poolers do not
 * support the extended protocol's named prepared statements the way postgres.js
 * uses them by default.
 */
const client = postgres(env().DATABASE_URL, {
  max: 3,
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
