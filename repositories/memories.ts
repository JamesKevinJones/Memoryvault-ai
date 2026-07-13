import {
  and,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  lt,
  or,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db/client";
import { memories } from "@/db/schema";
import type {
  CreateMemoryInput,
  MemoryListFilters,
  UpdateMemoryInput,
} from "@/features/memory/types";

export type Memory = typeof memories.$inferSelect;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parseMemoryListCursor(cursor?: string): Date | undefined {
  if (!cursor) return undefined;
  const date = new Date(cursor);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

export type ResolvedMemoryListFilters = {
  workspaceId: string;
  excludeArchived: true;
  projectScope: "any" | "global" | { projectId: string };
  category?: MemoryListFilters["category"];
  minImportance?: number;
  pinned?: boolean;
  keywordPattern?: string;
  cursorDate?: Date;
  limit: number;
};

export function resolveMemoryListFilters(
  filters: MemoryListFilters,
): ResolvedMemoryListFilters {
  const limit = Math.min(filters.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const keyword = filters.q?.trim();

  return {
    workspaceId: filters.workspaceId,
    excludeArchived: true,
    projectScope:
      filters.projectId === undefined
        ? "any"
        : filters.projectId === null
          ? "global"
          : { projectId: filters.projectId },
    category: filters.category,
    minImportance: filters.minImportance,
    pinned: filters.pinned,
    keywordPattern: keyword ? `%${keyword}%` : undefined,
    cursorDate: parseMemoryListCursor(filters.cursor),
    limit,
  };
}

export function buildMemoryListConditions(
  filters: MemoryListFilters,
): SQL | undefined {
  const resolved = resolveMemoryListFilters(filters);
  const conditions: SQL[] = [
    eq(memories.workspaceId, resolved.workspaceId),
    isNull(memories.archivedAt),
  ];

  if (resolved.projectScope === "global") {
    conditions.push(isNull(memories.projectId));
  } else if (resolved.projectScope !== "any") {
    conditions.push(eq(memories.projectId, resolved.projectScope.projectId));
  }

  if (resolved.category) {
    conditions.push(eq(memories.category, resolved.category));
  }

  if (resolved.minImportance !== undefined) {
    conditions.push(gte(memories.importance, resolved.minImportance));
  }

  if (resolved.pinned !== undefined) {
    conditions.push(eq(memories.pinned, resolved.pinned));
  }

  if (resolved.keywordPattern) {
    conditions.push(
      or(
        ilike(memories.title, resolved.keywordPattern),
        ilike(memories.content, resolved.keywordPattern),
      )!,
    );
  }

  if (resolved.cursorDate) {
    conditions.push(lt(memories.createdAt, resolved.cursorDate));
  }

  return and(...conditions);
}

export async function listMemories(
  filters: MemoryListFilters,
): Promise<{ items: Memory[]; nextCursor: string | null }> {
  const resolved = resolveMemoryListFilters(filters);
  const where = buildMemoryListConditions(filters);

  const rows = await db
    .select()
    .from(memories)
    .where(where)
    .orderBy(desc(memories.createdAt))
    .limit(resolved.limit + 1);

  const hasMore = rows.length > resolved.limit;
  const items = hasMore ? rows.slice(0, resolved.limit) : rows;
  const nextCursor =
    hasMore && items.length > 0
      ? items[items.length - 1].createdAt.toISOString()
      : null;

  return { items, nextCursor };
}

export async function getMemoryById(
  workspaceId: string,
  id: string,
): Promise<Memory | null> {
  const [row] = await db
    .select()
    .from(memories)
    .where(and(eq(memories.id, id), eq(memories.workspaceId, workspaceId)))
    .limit(1);

  return row ?? null;
}

export async function createMemory(input: CreateMemoryInput): Promise<Memory> {
  const now = new Date();
  const id = crypto.randomUUID();

  const [row] = await db
    .insert(memories)
    .values({
      id,
      workspaceId: input.workspaceId,
      projectId: input.projectId ?? null,
      category: input.category,
      title: input.title,
      content: input.content,
      summary: input.summary ?? null,
      importance: input.importance ?? 0,
      pinned: input.pinned ?? false,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return row;
}

export async function updateMemory(
  workspaceId: string,
  id: string,
  patch: UpdateMemoryInput,
): Promise<Memory | null> {
  const [row] = await db
    .update(memories)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(memories.id, id), eq(memories.workspaceId, workspaceId)))
    .returning();

  return row ?? null;
}

export async function deleteMemory(
  workspaceId: string,
  id: string,
): Promise<boolean> {
  const deleted = await db
    .delete(memories)
    .where(and(eq(memories.id, id), eq(memories.workspaceId, workspaceId)))
    .returning({ id: memories.id });

  return deleted.length > 0;
}
