import Link from "next/link";
import { MessageSquare, FileText, CheckSquare } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { MemoryDashboard } from "@/features/memory/ui/memory-dashboard";
import type { Project } from "@/repositories/projects";
import type { Task } from "@/repositories/tasks";
import type { Document } from "@/repositories/documents";

type ProjectDetailProps = {
  project: Project;
  tasks: Task[];
  documents: Document[];
};

export function ProjectDetail({
  project,
  tasks,
  documents,
}: ProjectDetailProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <PageHeader
        title={project.name}
        description={project.description ?? "Project-scoped memory vault"}
        action={
          <Link
            href={`/chat?projectId=${project.id}`}
            className={buttonVariants({ size: "default" })}
          >
            <MessageSquare data-icon="inline-start" />
            Project chat
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <CheckSquare className="size-4 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold">Open tasks</h2>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open tasks.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
                >
                  {task.title}
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/tasks?projectId=${project.id}`}
            className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground"
          >
            View all tasks →
          </Link>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold">Documents</h2>
          </div>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents yet.</p>
          ) : (
            <ul className="space-y-2">
              {documents.slice(0, 5).map((doc) => (
                <li
                  key={doc.id}
                  className="rounded-lg border border-border bg-muted/20 px-3 py-2"
                >
                  <p className="text-sm font-medium">{doc.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {doc.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/documents?projectId=${project.id}`}
            className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground"
          >
            View all documents →
          </Link>
        </section>
      </div>

      <MemoryDashboard
        projectId={project.id}
        title="Project memories"
        description="Memories scoped to this project."
      />
    </div>
  );
}
