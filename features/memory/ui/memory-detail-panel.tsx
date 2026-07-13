"use client";

import { useEffect, useState } from "react";
import { Pin, Trash2 } from "lucide-react";
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

export function MemoryDetailPanel() {
  const { selectedMemory, upsertMemory, removeMemory, setSelectedId } =
    useMemoryDashboard();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] =
    useState<(typeof MEMORY_CATEGORIES)[number]>("note");
  const [importance, setImportance] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedMemory) return;
    setTitle(selectedMemory.title);
    setContent(selectedMemory.content);
    setCategory(selectedMemory.category as (typeof MEMORY_CATEGORIES)[number]);
    setImportance(selectedMemory.importance);
    setEditing(false);
    setError(null);
  }, [selectedMemory]);

  if (!selectedMemory) {
    return (
      <aside className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
        Select a memory to view details.
      </aside>
    );
  }

  const memory = selectedMemory;

  async function patchMemory(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/v1/memories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Failed to update memory");
    const data = (await res.json()) as { memory: Parameters<typeof upsertMemory>[0] };
    upsertMemory(data.memory);
    return data.memory;
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await patchMemory(memory.id, { title, content, category, importance });
      setEditing(false);
    } catch {
      setError("Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePin() {
    setSaving(true);
    setError(null);
    try {
      await patchMemory(memory.id, { pinned: !memory.pinned });
    } catch {
      setError("Could not update pin.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this memory?")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/memories/${memory.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete memory");
      removeMemory(memory.id);
      setSelectedId(null);
    } catch {
      setError("Could not delete memory.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {CATEGORY_LABELS[selectedMemory.category] ?? selectedMemory.category}
          </p>
          {!editing ? (
            <h2 className="font-heading text-xl font-semibold text-card-foreground">
              {selectedMemory.title}
            </h2>
          ) : null}
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={selectedMemory.pinned ? "secondary" : "outline"}
            size="icon-sm"
            onClick={() => void handleTogglePin()}
            disabled={saving}
            aria-label={selectedMemory.pinned ? "Unpin memory" : "Pin memory"}
          >
            <Pin className={selectedMemory.pinned ? "fill-current" : ""} />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            onClick={() => void handleDelete()}
            disabled={saving}
            aria-label="Delete memory"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="space-y-3">
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClass}
          />
          <textarea
            required
            rows={8}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className={inputClass}
          />
          <div className="grid gap-3 sm:grid-cols-2">
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
            <input
              type="number"
              min={0}
              max={100}
              value={importance}
              onChange={(event) => setImportance(Number(event.target.value))}
              className={inputClass}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {selectedMemory.content}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Updated {new Date(selectedMemory.updatedAt).toLocaleString()}
            </span>
            <span>Importance {selectedMemory.importance}</span>
          </div>
          <Button type="button" variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </aside>
  );
}
