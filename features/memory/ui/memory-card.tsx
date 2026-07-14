"use client";

import { Pin } from "lucide-react";
import type { Memory } from "@/repositories/memories";
import { Badge } from "@/components/ui/badge";
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
        "w-full rounded-2xl border bg-card p-4 text-left shadow-xs transition-all duration-200",
        selected
          ? "border-primary/40 ring-1 ring-primary/15"
          : "border-border hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            {memory.pinned && (
              <Pin className="size-3.5 shrink-0 fill-current text-primary" />
            )}
            <h3 className="truncate text-[15px] font-medium text-card-foreground">
              {memory.title}
            </h3>
          </div>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {preview}
          </p>
        </div>
        <Badge variant="accent" className="shrink-0">
          {CATEGORY_LABELS[memory.category] ?? memory.category}
        </Badge>
      </div>
      <div className="mt-3 flex items-center gap-3 text-caption text-muted-foreground">
        <span>{new Date(memory.createdAt).toLocaleDateString()}</span>
        {memory.importance > 0 && (
          <>
            <span className="text-border">·</span>
            <span>Importance {memory.importance}</span>
          </>
        )}
      </div>
    </button>
  );
}
