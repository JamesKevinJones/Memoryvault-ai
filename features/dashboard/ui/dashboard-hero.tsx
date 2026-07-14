import Link from "next/link";
import {
  CheckSquare,
  FileText,
  FolderKanban,
  MessageSquare,
  Pin,
  Plus,
  Sparkles,
} from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDashboardOverview } from "@/features/dashboard/use-cases/get-dashboard-overview";

const CATEGORY_LABELS: Record<string, string> = {
  preference: "Preference",
  fact: "Fact",
  note: "Note",
  task_signal: "Task signal",
  project_info: "Project info",
};

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card padding="sm" className="flex items-center justify-between gap-3">
      <div>
        <p className="text-caption text-muted-foreground">{label}</p>
        <p className="mt-1 text-title font-semibold tracking-[-0.01em] text-foreground">
          {value}
        </p>
      </div>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent">
        <Icon className="size-4 text-accent-foreground" />
      </div>
    </Card>
  );
}

export async function DashboardHero({ workspaceId }: { workspaceId: string }) {
  const { stats, pinned, recentActivity, recentProjects } =
    await getDashboardOverview(workspaceId);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="An overview of everything your vault remembers."
        action={
          <Link href="/chat" className={cn(buttonVariants({ variant: "default" }))}>
            <MessageSquare data-icon="inline-start" />
            Start a chat
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Total memories" value={stats.totalMemories} icon={Sparkles} />
        <StatTile label="Pinned" value={stats.pinnedMemories} icon={Pin} />
        <StatTile label="Projects" value={stats.totalProjects} icon={FolderKanban} />
        <StatTile label="New this week" value={stats.newThisWeek} icon={Plus} />
        <StatTile label="Open tasks" value={stats.openTasks} icon={CheckSquare} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Pinned memories</CardTitle>
            <Pin className="size-4 text-muted-foreground" />
          </div>
          {pinned.length === 0 ? (
            <CardDescription>Pin important memories to see them here.</CardDescription>
          ) : (
            <ul className="space-y-1">
              {pinned.map((memory) => (
                <li key={memory.id}>
                  <Link
                    href={`/dashboard?focus=${memory.id}`}
                    className="block rounded-lg px-2.5 py-2 text-sm transition-colors duration-150 hover:bg-muted"
                  >
                    <span className="block truncate font-medium text-foreground">
                      {memory.title}
                    </span>
                    <span className="text-caption text-muted-foreground">
                      Importance {memory.importance}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Recent activity</CardTitle>
          </div>
          {recentActivity.length === 0 ? (
            <CardDescription>New memories will show up here.</CardDescription>
          ) : (
            <ul className="space-y-1">
              {recentActivity.map((memory) => (
                <li key={memory.id}>
                  <Link
                    href={`/dashboard?focus=${memory.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors duration-150 hover:bg-muted"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                      {memory.title}
                    </span>
                    <span className="shrink-0 text-caption text-muted-foreground">
                      {relativeTime(new Date(memory.createdAt))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <CardTitle>Recent projects</CardTitle>
              <FolderKanban className="size-4 text-muted-foreground" />
            </div>
            {recentProjects.length === 0 ? (
              <CardDescription>
                <Link href="/projects" className="underline decoration-dotted">
                  Create a project
                </Link>{" "}
                to scope memories and chat.
              </CardDescription>
            ) : (
              <ul className="space-y-1">
                {recentProjects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/projects/${project.id}`}
                      className="block truncate rounded-lg px-2.5 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted"
                    >
                      {project.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle className="mb-3">Quick actions</CardTitle>
            <div className="flex flex-col gap-1.5">
              <Link
                href="/projects"
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors duration-150 hover:bg-muted"
              >
                <FolderKanban className="size-4 text-muted-foreground" />
                New project
              </Link>
              <Link
                href="/tasks"
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors duration-150 hover:bg-muted"
              >
                <CheckSquare className="size-4 text-muted-foreground" />
                Add a task
              </Link>
              <Link
                href="/documents"
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors duration-150 hover:bg-muted"
              >
                <FileText className="size-4 text-muted-foreground" />
                New document
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
