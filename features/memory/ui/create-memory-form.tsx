"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MEMORY_CATEGORIES } from "@/features/memory/types";
import { useMemoryDashboard } from "@/features/memory/ui/memory-timeline";

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
    <Card
      padding="lg"
      className="w-full animate-in fade-in slide-in-from-top-2 duration-200 sm:w-[420px]"
    >
      <div className="mb-4 flex items-center justify-between">
        <CardTitle>Add memory</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowCreateForm(false)}
        >
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-caption font-medium text-muted-foreground">Title</span>
          <Input required value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <label className="block space-y-1.5">
          <span className="text-caption font-medium text-muted-foreground">Content</span>
          <Textarea
            required
            rows={4}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-caption font-medium text-muted-foreground">Category</span>
            <Select
              items={categoryItems}
              value={category}
              onValueChange={(value) =>
                setCategory(value as (typeof MEMORY_CATEGORIES)[number])
              }
              aria-label="Category"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-caption font-medium text-muted-foreground">
              Importance
            </span>
            <Input
              type="number"
              min={0}
              max={100}
              value={importance}
              onChange={(event) => setImportance(Number(event.target.value))}
            />
          </label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save memory"}
        </Button>
      </form>
    </Card>
  );
}
