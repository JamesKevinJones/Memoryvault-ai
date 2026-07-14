import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";
import {
  createDocumentBodySchema,
  parseListDocumentsQuery,
  updateDocumentBodySchema,
} from "@/features/documents/api/document-schemas";
import {
  createDocument,
  deleteDocument,
  getDocumentById,
  listDocuments,
  updateDocument,
} from "@/repositories/documents";

type HandlerResult =
  | { ok: true; status: number; body: unknown }
  | { ok: false; status: number; body: { error: string } };

async function requireWorkspaceId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { workspaceId } = await ensureWorkspace(session.user.id);
  return workspaceId;
}

export async function handleListDocuments(
  searchParams: URLSearchParams,
): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return { ok: false, status: 401, body: { error: "unauthorized" } };

  const parsed = parseListDocumentsQuery(searchParams);
  if (!parsed.ok) return { ok: false, status: 400, body: { error: "validation failed" } };

  const items = await listDocuments({
    workspaceId,
    projectId:
      parsed.data.projectId === "global"
        ? null
        : parsed.data.projectId,
  });

  return { ok: true, status: 200, body: { items } };
}

export async function handleCreateDocument(body: unknown): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return { ok: false, status: 401, body: { error: "unauthorized" } };

  const parsed = createDocumentBodySchema.safeParse(body);
  if (!parsed.success) return { ok: false, status: 400, body: { error: "validation failed" } };

  const document = await createDocument({ workspaceId, ...parsed.data });
  return { ok: true, status: 201, body: { document } };
}

export async function handleGetDocument(id: string): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return { ok: false, status: 401, body: { error: "unauthorized" } };

  const document = await getDocumentById(workspaceId, id);
  if (!document) return { ok: false, status: 404, body: { error: "not found" } };

  return { ok: true, status: 200, body: { document } };
}

export async function handleUpdateDocument(
  id: string,
  body: unknown,
): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return { ok: false, status: 401, body: { error: "unauthorized" } };

  const parsed = updateDocumentBodySchema.safeParse(body);
  if (!parsed.success) return { ok: false, status: 400, body: { error: "validation failed" } };

  const document = await updateDocument(workspaceId, id, parsed.data);
  if (!document) return { ok: false, status: 404, body: { error: "not found" } };

  return { ok: true, status: 200, body: { document } };
}

export async function handleDeleteDocument(id: string): Promise<HandlerResult> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return { ok: false, status: 401, body: { error: "unauthorized" } };

  const deleted = await deleteDocument(workspaceId, id);
  if (!deleted) return { ok: false, status: 404, body: { error: "not found" } };

  return { ok: true, status: 204, body: null };
}

export function toResponse(result: HandlerResult): Response {
  if (result.status === 204) return new Response(null, { status: 204 });
  return Response.json(result.body, { status: result.status });
}
