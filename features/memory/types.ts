export const MEMORY_CATEGORIES = [
  "preference",
  "fact",
  "note",
  "task_signal",
  "project_info",
] as const;

export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

export type MemoryListFilters = {
  workspaceId: string;
  projectId?: string | null;
  category?: MemoryCategory;
  minImportance?: number;
  pinned?: boolean;
  q?: string;
  sourceConversationId?: string;
  cursor?: string;
  limit?: number;
};

export type CreateMemoryInput = {
  workspaceId: string;
  projectId?: string | null;
  category: MemoryCategory;
  title: string;
  content: string;
  summary?: string | null;
  importance?: number;
  pinned?: boolean;
  sourceConversationId?: string | null;
  sourceMessageId?: string | null;
};

export type UpdateMemoryInput = Partial<{
  title: string;
  content: string;
  summary: string | null;
  category: MemoryCategory;
  importance: number;
  pinned: boolean;
  projectId: string | null;
  archivedAt: Date | null;
}>;
