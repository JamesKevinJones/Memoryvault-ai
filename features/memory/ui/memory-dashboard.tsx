import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";
import { listMemoriesUseCase } from "@/features/memory/use-cases/list-memories";
import { CreateMemoryForm } from "@/features/memory/ui/create-memory-form";
import { MemoryDetailPanel } from "@/features/memory/ui/memory-detail-panel";
import { MemoryFilters } from "@/features/memory/ui/memory-filters";
import {
  MemoryDashboardProvider,
  MemoryTimeline,
} from "@/features/memory/ui/memory-timeline";
import { PageHeader } from "@/components/ui/page-header";

type MemoryDashboardProps = {
  projectId?: string;
  title?: string;
  description?: string;
  initialSelectedId?: string;
  headingSize?: "display" | "title";
};

export async function MemoryDashboard({
  projectId,
  title = "Memory timeline",
  description = "Browse, filter, and manage your long-term memories.",
  initialSelectedId,
  headingSize = "display",
}: MemoryDashboardProps) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { workspaceId } = await ensureWorkspace(session.user.id);
  const { items } = await listMemoriesUseCase(workspaceId, {
    projectId,
    limit: 50,
  });

  return (
    <MemoryDashboardProvider
      initialItems={items}
      projectId={projectId}
      initialSelectedId={initialSelectedId}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <PageHeader
          title={title}
          description={description}
          action={<CreateMemoryForm />}
          size={headingSize}
        />

        <MemoryFilters />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <MemoryTimeline />
          <MemoryDetailPanel />
        </div>
      </div>
    </MemoryDashboardProvider>
  );
}
