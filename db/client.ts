import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { databaseUrl } from "@/lib/env";
import * as schema from "./schema";

/**
 * Eager on purpose: the Auth.js Drizzle adapter inspects this object's
 * prototype at construction to detect the dialect, so it cannot be a lazy
 * Proxy. postgres.js opens no socket until a query actually runs, so building
 * this at import costs nothing.
 *
 * `max` is per process, not per deployment. On Vercel each concurrent lambda
 * gets its own pool, so a generous number multiplies by instance count and
 * exhausts CockroachDB's connection limit under fan-out.
 *
 * `prepare: false` is required: CockroachDB and connection poolers do not
 * support named prepared statements the way postgres.js uses them by default.
 */
const client = postgres(databaseUrl(), {
  max: 3,
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
