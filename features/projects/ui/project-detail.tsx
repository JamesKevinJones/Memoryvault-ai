import Link from "next/link";
import { MessageSquare, FileText, CheckSquare, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { MemoryDashboard } from "@/features/memory/ui/memory-dashboard";
import type { Project } from "@/repositories/projects";
import type { Task } from "@/repositories/tasks";
import type { Document } from "@/repositories/documents";
import { cn } from "@/lib/utils";

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
            className={cn(buttonVariants({ size: "default" }))}
          >
            <MessageSquare data-icon="inline-start" />
            Project chat
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <CheckSquare className="size-4 text-muted-foreground" />
            <CardTitle>Open tasks</CardTitle>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open tasks.</p>
          ) : (
            <ul className="space-y-1.5">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-lg bg-muted/40 px-2.5 py-2 text-sm text-foreground"
                >
                  {task.title}
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/tasks?projectId=${project.id}`}
            className="mt-4 inline-flex items-center gap-1 text-caption text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            View all tasks
            <ArrowRight className="size-3" />
          </Link>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <CardTitle>Documents</CardTitle>
          </div>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {documents.slice(0, 5).map((doc) => (
                <li key={doc.id} className="rounded-lg bg-muted/40 px-2.5 py-2">
                  <p className="text-sm font-medium text-foreground">{doc.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-caption text-muted-foreground">
                    {doc.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/documents?projectId=${project.id}`}
            className="mt-4 inline-flex items-center gap-1 text-caption text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            View all documents
            <ArrowRight className="size-3" />
          </Link>
        </Card>
      </div>

      <MemoryDashboard
        projectId={project.id}
        title="Project memories"
        description="Memories scoped to this project."
        headingSize="title"
      />
    </div>
  );
}
