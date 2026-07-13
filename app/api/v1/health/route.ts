import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return Response.json({ status: "ok", db: "up" });
  } catch {
    return Response.json({ status: "degraded", db: "down" }, { status: 503 });
  }
}
