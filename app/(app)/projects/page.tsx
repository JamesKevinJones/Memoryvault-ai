import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";
import { ProjectsList } from "@/features/projects/ui/projects-list";
import { listProjects } from "@/repositories/projects";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { workspaceId } = await ensureWorkspace(session.user.id);
  const items = await listProjects(workspaceId);

  return <ProjectsList initialProjects={items} />;
}
