"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import type { Project } from "@/repositories/projects";

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
        <Card
          padding="lg"
          className="animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <form onSubmit={handleCreate}>
            <div className="space-y-3">
              <Input
                required
                placeholder="Project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Textarea
                placeholder="Description (optional)"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating…" : "Create project"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </Card>
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
              <Link href={`/projects/${project.id}`} className="block">
                <Card interactive className="h-full">
                  <h2 className="text-heading font-medium text-foreground">
                    {project.name}
                  </h2>
                  {project.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                  <p className="mt-4 text-caption text-muted-foreground">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
