"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import type { Project } from "@/repositories/projects";

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors duration-200 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type ProjectsListProps = {
  initialProjects: Project[];
};

export function ProjectsList({ initialProjects }: ProjectsListProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || null }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { project: Project };
      setProjects((current) => [data.project, ...current]);
      setName("");
      setDescription("");
      setShowForm(false);
      router.push(`/projects/${data.project.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <PageHeader
        title="Projects"
        description="Scoped vaults for focused memory, tasks, and chat."
        action={
          <Button type="button" onClick={() => setShowForm(true)}>
            <Plus data-icon="inline-start" />
            New project
          </Button>
        }
      />

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="animate-in fade-in slide-in-from-top-2 duration-200 rounded-xl border border-border bg-card p-5"
        >
          <div className="space-y-3">
            <input
              required
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
            <textarea
              placeholder="Description (optional)"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create project"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project to scope memories, tasks, and chat around a specific goal."
          action={
            <Button type="button" onClick={() => setShowForm(true)}>
              <Plus data-icon="inline-start" />
              Create your first project
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="block rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-foreground/20 hover:bg-muted/30 hover:shadow-sm"
              >
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  {project.name}
                </h2>
                {project.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {project.description}
                  </p>
                )}
                <p className="mt-4 text-xs text-muted-foreground">
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
