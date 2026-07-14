import { listMemoriesUseCase } from "@/features/memory/use-cases/list-memories";
import { listPinnedOrImportantMemories } from "@/repositories/memories";
import { listProjects } from "@/repositories/projects";
import { getWorkspaceStats } from "@/repositories/workspace-stats";

export async function getDashboardOverview(workspaceId: string) {
  const [stats, pinned, recent, projects] = await Promise.all([
    getWorkspaceStats(workspaceId),
    listPinnedOrImportantMemories({ workspaceId, limit: 5 }),
    listMemoriesUseCase(workspaceId, { limit: 6 }),
    listProjects(workspaceId),
  ]);

  return {
    stats,
    pinned,
    recentActivity: recent.items,
    recentProjects: projects.slice(0, 4),
  };
}
