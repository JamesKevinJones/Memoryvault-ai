"use client";

import { useState } from "react";
import { Check, CheckSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import type { Task } from "@/repositories/tasks";

type TasksPageClientProps = {
  initialTasks: Task[];
  projectId?: string;
};

function TaskRow({ task, onToggle }: { task: Task; onToggle: (task: Task) => void }) {
  const done = task.status === "done";
  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(task)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 hover:bg-muted/60"
      >
        <span
          className={cn(
            "flex size-[18px] shrink-0 items-center justify-center rounded-full border transition-colors duration-150",
            done ? "border-primary bg-primary text-primary-foreground" : "border-border",
          )}
        >
          {done && <Check className="size-3" strokeWidth={3} />}
        </span>
        <span
          className={cn(
            "text-sm text-foreground",
            done && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </span>
      </button>
    </li>
  );
}

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

      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          required
          placeholder="Add a task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
        <div className="space-y-6">
          {openTasks.length > 0 && (
            <section>
              <p className="mb-1.5 px-1 text-caption font-medium text-muted-foreground">
                Open — {openTasks.length}
              </p>
              <Card padding="sm">
                <ul>
                  {openTasks.map((task) => (
                    <TaskRow key={task.id} task={task} onToggle={toggleTask} />
                  ))}
                </ul>
              </Card>
            </section>
          )}
          {doneTasks.length > 0 && (
            <section>
              <p className="mb-1.5 px-1 text-caption font-medium text-muted-foreground">
                Done — {doneTasks.length}
              </p>
              <Card padding="sm">
                <ul>
                  {doneTasks.map((task) => (
                    <TaskRow key={task.id} task={task} onToggle={toggleTask} />
                  ))}
                </ul>
              </Card>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
