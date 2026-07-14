import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { workspaces } from "./workspaces";

export const memories = pgTable(
  "memories",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    category: text("category").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    summary: text("summary"),
    importance: integer("importance").notNull().default(0),
    pinned: boolean("pinned").notNull().default(false),
    sourceConversationId: text("source_conversation_id"),
    sourceMessageId: text("source_message_id"),
    sourceDocumentId: text("source_document_id"),
    sourceTaskId: text("source_task_id"),
    archivedAt: timestamp("archived_at", { mode: "date", withTimezone: true }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    lastAccessedAt: timestamp("last_accessed_at", {
      mode: "date",
      withTimezone: true,
    }),
  },
  (t) => [
    index("memories_workspace_created_at_idx").on(t.workspaceId, t.createdAt),
    index("memories_workspace_project_idx").on(t.workspaceId, t.projectId),
    index("memories_workspace_category_idx").on(t.workspaceId, t.category),
  ],
);

export const memoryLinks = pgTable(
  "memory_links",
  {
    id: text("id").primaryKey(),
    fromMemoryId: text("from_memory_id")
      .notNull()
      .references(() => memories.id, { onDelete: "cascade" }),
    toMemoryId: text("to_memory_id")
      .notNull()
      .references(() => memories.id, { onDelete: "cascade" }),
    relationType: text("relation_type").notNull(),
    strength: integer("strength").notNull().default(1),
  },
  (t) => [
    unique("memory_links_from_to_relation_unique").on(
      t.fromMemoryId,
      t.toMemoryId,
      t.relationType,
    ),
  ],
);
