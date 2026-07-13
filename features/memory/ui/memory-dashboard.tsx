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

export async function MemoryDashboard() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { workspaceId } = await ensureWorkspace(session.user.id);
  const { items } = await listMemoriesUseCase(workspaceId, { limit: 50 });

  return (
    <MemoryDashboardProvider initialItems={items}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground">
              Memory timeline
            </h1>
            <p className="text-sm text-muted-foreground">
              Browse, filter, and manage your long-term memories.
            </p>
          </div>
          <CreateMemoryForm />
        </div>

        <MemoryFilters />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <MemoryTimeline />
          <MemoryDetailPanel />
        </div>
      </div>
    </MemoryDashboardProvider>
  );
}
