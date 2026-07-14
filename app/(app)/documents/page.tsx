import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";
import { DocumentsPageClient } from "@/features/documents/ui/documents-page";
import { listDocuments } from "@/repositories/documents";

type DocumentsPageProps = {
  searchParams: Promise<{ projectId?: string }>;
};

export default async function DocumentsPage({
  searchParams,
}: DocumentsPageProps) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { projectId } = await searchParams;
  const { workspaceId } = await ensureWorkspace(session.user.id);
  const items = await listDocuments({ workspaceId, projectId, limit: 50 });

  return (
    <DocumentsPageClient initialDocuments={items} projectId={projectId} />
  );
}
