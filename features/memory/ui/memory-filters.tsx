"use client";

import { useEffect } from "react";
import { MEMORY_CATEGORIES } from "@/features/memory/types";
import { useMemoryDashboard } from "@/features/memory/ui/memory-timeline";

const CATEGORY_LABELS: Record<string, string> = {
  preference: "Preference",
  fact: "Fact",
  note: "Note",
  task_signal: "Task signal",
  project_info: "Project info",
};

const inputClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function MemoryFilters() {
  const { filters, setFilters, setDebouncedQ } = useMemoryDashboard();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQ(filters.q.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [filters.q, setDebouncedQ]);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="min-w-[220px] flex-1 space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Search</span>
        <input
          type="search"
          value={filters.q}
          onChange={(event) => setFilters({ q: event.target.value })}
          placeholder="Search title or content…"
          className={inputClass}
        />
      </label>

      <label className="w-44 space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Category</span>
        <select
          value={filters.category ?? ""}
          onChange={(event) =>
            setFilters({
              category: event.target.value
                ? (event.target.value as (typeof MEMORY_CATEGORIES)[number])
                : undefined,
            })
          }
          className={inputClass}
        >
          <option value="">All categories</option>
          {MEMORY_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </label>

      <label className="w-40 space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          Min importance
        </span>
        <select
          value={filters.importance ?? ""}
          onChange={(event) =>
            setFilters({
              importance: event.target.value
                ? Number(event.target.value)
                : undefined,
            })
          }
          className={inputClass}
        >
          <option value="">Any</option>
          <option value="25">25+</option>
          <option value="50">50+</option>
          <option value="75">75+</option>
        </select>
      </label>
    </div>
  );
}
