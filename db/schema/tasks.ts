import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { memories } from "./memories";
import { projects } from "./projects";
import { workspaces } from "./workspaces";

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  projectId: text("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  status: text("status").notNull().default("open"),
  dueAt: timestamp("due_at", { mode: "date", withTimezone: true }),
  memoryId: text("memory_id").references(() => memories.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});
