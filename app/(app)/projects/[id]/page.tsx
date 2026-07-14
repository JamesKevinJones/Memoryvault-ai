import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";
import { ProjectDetail } from "@/features/projects/ui/project-detail";
import { getProjectById } from "@/repositories/projects";
import { listOpenTasks } from "@/repositories/tasks";
import { listDocuments } from "@/repositories/documents";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const { workspaceId } = await ensureWorkspace(session.user.id);
  const project = await getProjectById(workspaceId, id);
  if (!project) notFound();

  const [tasks, documents] = await Promise.all([
    listOpenTasks({ workspaceId, projectId: id, limit: 5 }),
    listDocuments({ workspaceId, projectId: id, limit: 5 }),
  ]);

  return (
    <ProjectDetail project={project} tasks={tasks} documents={documents} />
  );
}
