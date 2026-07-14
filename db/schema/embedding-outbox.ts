import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { memories } from "./memories";
import { projects } from "./projects";
import { users } from "./auth";
import { workspaces } from "./workspaces";

export const EMBED_OUTBOX_OPERATIONS = ["create", "update"] as const;
export type EmbedOutboxOperation = (typeof EMBED_OUTBOX_OPERATIONS)[number];

export const EMBED_OUTBOX_STATUSES = [
  "pending",
  "processing",
  "completed",
  "dead",
] as const;
export type EmbedOutboxStatus = (typeof EMBED_OUTBOX_STATUSES)[number];

export const embeddingOutbox = pgTable(
  "embedding_outbox",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    memoryId: text("memory_id")
      .notNull()
      .references(() => memories.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    operation: text("operation").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    claimToken: text("claim_token"),
    claimedAt: timestamp("claimed_at", { mode: "date", withTimezone: true }),
    nextAttemptAt: timestamp("next_attempt_at", {
      mode: "date",
      withTimezone: true,
    }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("embedding_outbox_status_created_idx").on(t.status, t.createdAt),
    index("embedding_outbox_memory_id_idx").on(t.memoryId),
    index("embedding_outbox_pending_next_attempt_idx").on(
      t.status,
      t.nextAttemptAt,
    ),
    check(
      "embedding_outbox_operation_check",
      sql`${t.operation} in ('create', 'update')`,
    ),
    check(
      "embedding_outbox_status_check",
      sql`${t.status} in ('pending', 'processing', 'completed', 'dead')`,
    ),
  ],
);
