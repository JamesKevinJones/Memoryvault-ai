"use client";

import { useEffect } from "react";
import { Search } from "lucide-react";
import { MEMORY_CATEGORIES } from "@/features/memory/types";
import { useMemoryDashboard } from "@/features/memory/ui/memory-timeline";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const CATEGORY_LABELS: Record<string, string> = {
  preference: "Preference",
  fact: "Fact",
  note: "Note",
  task_signal: "Task signal",
  project_info: "Project info",
};

const categoryItems = [
  { value: "", label: "All categories" },
  ...MEMORY_CATEGORIES.map((category) => ({
    value: category,
    label: CATEGORY_LABELS[category],
  })),
];

const importanceItems = [
  { value: "", label: "Any importance" },
  { value: "25", label: "25+" },
  { value: "50", label: "50+" },
  { value: "75", label: "75+" },
];

export function MemoryFilters() {
  const { filters, setFilters, setDebouncedQ } = useMemoryDashboard();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQ(filters.q.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [filters.q, setDebouncedQ]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={filters.q}
          onChange={(event) => setFilters({ q: event.target.value })}
          placeholder="Search title or content…"
          className="pl-8"
        />
      </div>

      <div className="w-44">
        <Select
          items={categoryItems}
          value={filters.category ?? ""}
          onValueChange={(value) =>
            setFilters({
              category: value
                ? (value as (typeof MEMORY_CATEGORIES)[number])
                : undefined,
            })
          }
          aria-label="Filter by category"
        />
      </div>

      <div className="w-40">
        <Select
          items={importanceItems}
          value={filters.importance !== undefined ? String(filters.importance) : ""}
          onValueChange={(value) =>
            setFilters({ importance: value ? Number(value) : undefined })
          }
          aria-label="Filter by importance"
        />
      </div>
    </div>
  );
}
