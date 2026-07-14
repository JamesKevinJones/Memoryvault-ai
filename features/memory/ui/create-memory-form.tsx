"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MEMORY_CATEGORIES } from "@/features/memory/types";
import { useMemoryDashboard } from "@/features/memory/ui/memory-timeline";

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const CATEGORY_LABELS: Record<string, string> = {
  preference: "Preference",
  fact: "Fact",
  note: "Note",
  task_signal: "Task signal",
  project_info: "Project info",
};

export function CreateMemoryForm() {
  const { showCreateForm, setShowCreateForm, upsertMemory, setSelectedId, projectId } =
    useMemoryDashboard();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] =
    useState<(typeof MEMORY_CATEGORIES)[number]>("note");
  const [importance, setImportance] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!showCreateForm) {
    return (
      <Button type="button" onClick={() => setShowCreateForm(true)}>
        <Plus data-icon="inline-start" />
        Add memory
      </Button>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          category,
          importance,
          ...(projectId ? { projectId } : {}),
        }),
      });
      if (!res.ok) throw new Error("Failed to create memory");
      const data = (await res.json()) as { memory: Parameters<typeof upsertMemory>[0] };
      upsertMemory(data.memory);
      setSelectedId(data.memory.id);
      setTitle("");
      setContent("");
      setCategory("note");
      setImportance(0);
      setShowCreateForm(false);
    } catch {
      setError("Could not create memory. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Add memory</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowCreateForm(false)}
        >
          Cancel
        </Button>
      </div>

      <div className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Title</span>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Content</span>
          <textarea
            required
            rows={4}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className={inputClass}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Category
            </span>
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as (typeof MEMORY_CATEGORIES)[number])
              }
              className={inputClass}
            >
              {MEMORY_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {CATEGORY_LABELS[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Importance
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={importance}
              onChange={(event) => setImportance(Number(event.target.value))}
              className={inputClass}
            />
          </label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save memory"}
        </Button>
      </div>
    </form>
  );
}
