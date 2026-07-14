"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Memory } from "@/repositories/memories";
import type { MemoryCategory } from "@/features/memory/types";
import { MemoryCard } from "@/features/memory/ui/memory-card";

export type MemoryFiltersState = {
  q: string;
  category?: MemoryCategory;
  importance?: number;
};

type MemoryListResponse = {
  items: Memory[];
  nextCursor: string | null;
};

type MemoryDashboardContextValue = {
  items: Memory[];
  loading: boolean;
  filters: MemoryFiltersState;
  debouncedQ: string;
  selectedId: string | null;
  selectedMemory: Memory | null;
  showCreateForm: boolean;
  setFilters: (patch: Partial<MemoryFiltersState>) => void;
  setDebouncedQ: (q: string) => void;
  setSelectedId: (id: string | null) => void;
  setShowCreateForm: (show: boolean) => void;
  refresh: () => Promise<void>;
  upsertMemory: (memory: Memory) => void;
  removeMemory: (id: string) => void;
};

const MemoryDashboardContext =
  createContext<MemoryDashboardContextValue | null>(null);

async function fetchMemories(
  filters: MemoryFiltersState,
): Promise<MemoryListResponse> {
  if (filters.q.trim()) {
    const params = new URLSearchParams({ q: filters.q.trim(), limit: "50" });
    if (filters.category) params.set("category", filters.category);
    const res = await fetch(`/api/v1/search?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to search memories");
    const data = (await res.json()) as {
      items: Array<{
        memoryId: string;
        title: string;
        content: string;
        category: string;
        importance: number;
        projectId: string | null;
        score: number;
      }>;
    };
    const now = new Date();
    return {
      items: data.items.map((hit) => ({
        id: hit.memoryId,
        workspaceId: "",
        projectId: hit.projectId,
        category: hit.category,
        title: hit.title,
        content: hit.content,
        summary: null,
        importance: hit.importance,
        pinned: false,
        sourceConversationId: null,
        sourceMessageId: null,
        sourceDocumentId: null,
        sourceTaskId: null,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
        lastAccessedAt: null,
      })),
      nextCursor: null,
    };
  }

  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.importance !== undefined) {
    params.set("importance", String(filters.importance));
  }
  params.set("limit", "50");

  const res = await fetch(`/api/v1/memories?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch memories");
  return res.json() as Promise<MemoryListResponse>;
}

type MemoryDashboardProviderProps = {
  initialItems: Memory[];
  children: ReactNode;
};

export function MemoryDashboardProvider({
  initialItems,
  children,
}: MemoryDashboardProviderProps) {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);
  const [filters, setFiltersState] = useState<MemoryFiltersState>({ q: "" });
  const [debouncedQ, setDebouncedQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialItems[0]?.id ?? null,
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const skipInitialRefresh = useRef(true);

  const effectiveFilters = useMemo(
    () => ({ ...filters, q: debouncedQ }),
    [filters, debouncedQ],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchMemories(effectiveFilters);
      setItems(result.items);
      setSelectedId((current) => {
        if (current && result.items.some((item) => item.id === current)) {
          return current;
        }
        return result.items[0]?.id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, [effectiveFilters]);

  useEffect(() => {
    if (skipInitialRefresh.current) {
      skipInitialRefresh.current = false;
      return;
    }
    void refresh();
  }, [effectiveFilters, refresh]);

  const setFilters = useCallback((patch: Partial<MemoryFiltersState>) => {
    setFiltersState((current) => ({ ...current, ...patch }));
  }, []);

  const upsertMemory = useCallback((memory: Memory) => {
    setItems((current) => {
      const index = current.findIndex((item) => item.id === memory.id);
      if (index === -1) return [memory, ...current];
      const next = [...current];
      next[index] = memory;
      return next;
    });
  }, []);

  const removeMemory = useCallback((id: string) => {
    setItems((current) => {
      const next = current.filter((item) => item.id !== id);
      setSelectedId((selected) =>
        selected === id ? (next[0]?.id ?? null) : selected,
      );
      return next;
    });
  }, []);

  const selectedMemory = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const value = useMemo(
    () => ({
      items,
      loading,
      filters,
      debouncedQ,
      selectedId,
      selectedMemory,
      showCreateForm,
      setFilters,
      setDebouncedQ,
      setSelectedId,
      setShowCreateForm,
      refresh,
      upsertMemory,
      removeMemory,
    }),
    [
      items,
      loading,
      filters,
      debouncedQ,
      selectedId,
      selectedMemory,
      showCreateForm,
      setFilters,
      refresh,
      upsertMemory,
      removeMemory,
    ],
  );

  return (
    <MemoryDashboardContext.Provider value={value}>
      {children}
    </MemoryDashboardContext.Provider>
  );
}

export function useMemoryDashboard() {
  const context = useContext(MemoryDashboardContext);
  if (!context) {
    throw new Error(
      "useMemoryDashboard must be used within MemoryDashboardProvider",
    );
  }
  return context;
}

export function MemoryTimeline() {
  const { items, loading, selectedId, setSelectedId } = useMemoryDashboard();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 132,
    overscan: 6,
  });

  useEffect(() => {
    virtualizer.measure();
  }, [items.length, virtualizer]);

  if (!loading && items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
        <h2 className="font-heading text-2xl font-semibold text-foreground">
          No memories yet
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Add your first memory to start building your vault.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {loading && (
        <p className="text-xs text-muted-foreground">Refreshing memories…</p>
      )}
      <div
        ref={parentRef}
        className="h-[calc(100vh-18rem)] overflow-auto pr-1"
      >
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const memory = items[virtualItem.index];
            return (
              <div
                key={memory.id}
                className="absolute top-0 left-0 w-full pb-3"
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <MemoryCard
                  memory={memory}
                  selected={selectedId === memory.id}
                  onSelect={(item) => setSelectedId(item.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
