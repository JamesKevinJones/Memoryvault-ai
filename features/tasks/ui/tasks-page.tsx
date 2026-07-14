"use client";

import { useState } from "react";
import { CheckSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import type { Task } from "@/repositories/tasks";

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors duration-200 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type TasksPageClientProps = {
  initialTasks: Task[];
  projectId?: string;
};

export function TasksPageClient({
  initialTasks,
  projectId,
}: TasksPageClientProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          ...(projectId ? { projectId } : {}),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { task: Task };
      setTasks((current) => [data.task, ...current]);
      setTitle("");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleTask(task: Task) {
    const nextStatus = task.status === "open" ? "done" : "open";
    const res = await fetch(`/api/v1/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { task: Task };
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? data.task : item)),
    );
  }

  const openTasks = tasks.filter((t) => t.status === "open");
  const doneTasks = tasks.filter((t) => t.status === "done");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="Tasks"
        description="Follow-ups surfaced from chat and manual entry."
      />

      <form
        onSubmit={handleCreate}
        className="flex gap-2 rounded-xl border border-border bg-card p-4"
      >
        <input
          required
          placeholder="Add a task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
        <Button type="submit" disabled={submitting}>
          <Plus data-icon="inline-start" />
          Add
        </Button>
      </form>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Tasks from cold-path extraction or manual entry appear here."
        />
      ) : (
        <div className="space-y-8">
          {openTasks.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Open</h2>
              <ul className="space-y-2">
                {openTasks.map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => toggleTask(task)}
                      className="w-full rounded-lg border border-border bg-card px-4 py-3 text-left text-sm transition-colors duration-200 hover:bg-muted/30"
                    >
                      {task.title}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {doneTasks.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Done</h2>
              <ul className="space-y-2">
                {doneTasks.map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => toggleTask(task)}
                      className="w-full rounded-lg border border-border bg-muted/20 px-4 py-3 text-left text-sm text-muted-foreground line-through transition-colors duration-200 hover:bg-muted/40"
                    >
                      {task.title}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
