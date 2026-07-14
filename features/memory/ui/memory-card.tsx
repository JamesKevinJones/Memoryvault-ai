"use client";

import { Pin } from "lucide-react";
import type { Memory } from "@/repositories/memories";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  preference: "Preference",
  fact: "Fact",
  note: "Note",
  task_signal: "Task signal",
  project_info: "Project info",
};

type MemoryCardProps = {
  memory: Memory;
  selected?: boolean;
  onSelect: (memory: Memory) => void;
};

export function MemoryCard({ memory, selected, onSelect }: MemoryCardProps) {
  const preview =
    memory.content.length > 140
      ? `${memory.content.slice(0, 140)}…`
      : memory.content;

  return (
    <button
      type="button"
      onClick={() => onSelect(memory)}
      className={cn(
        "w-full rounded-xl border bg-card p-4 text-left transition-all duration-200",
        selected
          ? "border-foreground/30 ring-1 ring-foreground/10"
          : "border-border hover:border-foreground/20 hover:bg-muted/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {memory.pinned && (
              <Pin className="size-3.5 shrink-0 fill-current text-muted-foreground" />
            )}
            <h3 className="truncate font-medium text-card-foreground">
              {memory.title}
            </h3>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{preview}</p>
        </div>
        <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          {CATEGORY_LABELS[memory.category] ?? memory.category}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span>{new Date(memory.createdAt).toLocaleDateString()}</span>
        {memory.importance > 0 && (
          <span>Importance {memory.importance}</span>
        )}
      </div>
    </button>
  );
}
