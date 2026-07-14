import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";
import { TasksPageClient } from "@/features/tasks/ui/tasks-page";
import { listTasks } from "@/repositories/tasks";

type TasksPageProps = {
  searchParams: Promise<{ projectId?: string }>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { projectId } = await searchParams;
  const { workspaceId } = await ensureWorkspace(session.user.id);
  const items = await listTasks({
    workspaceId,
    projectId,
    limit: 50,
  });

  return <TasksPageClient initialTasks={items} projectId={projectId} />;
}
