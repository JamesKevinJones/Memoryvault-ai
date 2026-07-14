import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";
import { DashboardHero } from "@/features/dashboard/ui/dashboard-hero";
import { MemoryDashboard } from "@/features/memory/ui/memory-dashboard";

type DashboardPageProps = {
  searchParams: Promise<{ focus?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { focus } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) return null;
  const { workspaceId } = await ensureWorkspace(session.user.id);

  return (
    <div className="flex flex-col gap-14">
      <DashboardHero workspaceId={workspaceId} />
      <MemoryDashboard
        title="All memories"
        description="Browse, filter, and manage your long-term memories."
        initialSelectedId={focus}
        headingSize="title"
      />
    </div>
  );
}
