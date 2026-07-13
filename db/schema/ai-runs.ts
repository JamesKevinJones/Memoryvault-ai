import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { conversations } from "./conversations";
import { projects } from "./projects";
import { workspaces } from "./workspaces";

export const aiRuns = pgTable("ai_runs", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  conversationId: text("conversation_id").references(() => conversations.id, {
    onDelete: "set null",
  }),
  projectId: text("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  path: text("path").notNull(),
  operation: text("operation").notNull(),
  modelId: text("model_id"),
  latencyMs: integer("latency_ms"),
  retrievalCount: integer("retrieval_count"),
  cacheHit: boolean("cache_hit"),
  status: text("status").notNull(),
  error: text("error"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});
