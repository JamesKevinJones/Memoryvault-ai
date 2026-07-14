"use client";

import { useEffect, useState } from "react";
import { Inbox, Link2, Pencil, Pin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MEMORY_CATEGORIES } from "@/features/memory/types";
import { useMemoryDashboard } from "@/features/memory/ui/memory-timeline";
import type { Memory } from "@/repositories/memories";
import { EmptyState } from "@/components/ui/empty-state";
import { Tooltip } from "@/components/ui/tooltip";

const CATEGORY_LABELS: Record<string, string> = {
  preference: "Preference",
  fact: "Fact",
  note: "Note",
  task_signal: "Task signal",
  project_info: "Project info",
};

const categoryItems = MEMORY_CATEGORIES.map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
}));

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
  const [related, setRelated] = useState<Memory[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!selectedMemory) return;
    setTitle(selectedMemory.title);
    setContent(selectedMemory.content);
    setCategory(selectedMemory.category as (typeof MEMORY_CATEGORIES)[number]);
    setImportance(selectedMemory.importance);
    setEditing(false);
    setError(null);
  }, [selectedMemory]);

  useEffect(() => {
    if (!selectedMemory) {
      setRelated([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/v1/memories/${selectedMemory.id}/related`)
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: Memory[] }) => {
        if (!cancelled) setRelated(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMemory]);

  if (!selectedMemory) {
    return (
      <EmptyState
        icon={Inbox}
        title="No memory selected"
        description="Choose a memory from the timeline to see its details."
        className="h-fit"
      />
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
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/memories/${memory.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete memory");
      removeMemory(memory.id);
      setSelectedId(null);
      setDeleteOpen(false);
    } catch {
      setError("Could not delete memory.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card padding="lg" className="h-fit">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
            {CATEGORY_LABELS[selectedMemory.category] ?? selectedMemory.category}
          </p>
          {!editing ? (
            <CardTitle className="mt-1 text-xl">{selectedMemory.title}</CardTitle>
          ) : null}
        </div>
        <div className="flex gap-1">
          <Tooltip content={selectedMemory.pinned ? "Unpin" : "Pin"}>
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
          </Tooltip>
          {!editing && (
            <Tooltip content="Edit">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => setEditing(true)}
                aria-label="Edit memory"
              >
                <Pencil />
              </Button>
            </Tooltip>
          )}
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <Tooltip content="Delete">
              <DialogTrigger
                render={
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    disabled={saving}
                    aria-label="Delete memory"
                  >
                    <Trash2 />
                  </Button>
                }
              />
            </Tooltip>
            <DialogContent size="sm">
              <DialogTitle className="text-heading font-medium">
                Delete this memory?
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
                This action can&apos;t be undone. &ldquo;{memory.title}&rdquo; will be
                permanently removed from your vault.
              </DialogDescription>
              <div className="mt-5 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={saving}
                  onClick={() => void handleDelete()}
                >
                  {saving ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="space-y-3">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
          <Textarea
            required
            rows={8}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              items={categoryItems}
              value={category}
              onValueChange={(value) =>
                setCategory(value as (typeof MEMORY_CATEGORIES)[number])
              }
              aria-label="Category"
            />
            <Input
              type="number"
              min={0}
              max={100}
              value={importance}
              onChange={(event) => setImportance(Number(event.target.value))}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {selectedMemory.content}
          </p>

          <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/50 p-3 text-caption">
            <div>
              <p className="text-muted-foreground">Importance</p>
              <p className="mt-0.5 font-medium text-foreground">
                {selectedMemory.importance}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Source</p>
              <p className="mt-0.5 font-medium text-foreground">
                {selectedMemory.sourceConversationId
                  ? "Chat extraction"
                  : "Manual entry"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="mt-0.5 font-medium text-foreground">
                {new Date(selectedMemory.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Updated</p>
              <p className="mt-0.5 font-medium text-foreground">
                {new Date(selectedMemory.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-caption font-medium text-muted-foreground">
              <Link2 className="size-3.5" />
              Related memories {related.length > 0 && `(${related.length})`}
            </p>
            {related.length === 0 ? (
              <p className="text-caption text-muted-foreground">
                No related memories linked yet.
              </p>
            ) : (
              <ul className="space-y-1">
                {related.map((item) => (
                  <li
                    key={item.id}
                    className="truncate rounded-lg bg-muted/40 px-2.5 py-1.5 text-sm text-foreground"
                  >
                    {item.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </Card>
  );
}
