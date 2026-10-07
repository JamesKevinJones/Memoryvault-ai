import { getProjectById } from "@/repositories/projects";

/**
 * A client-supplied projectId is a foreign key into another tenant's data if
 * nobody checks it. The list and get paths are workspace-scoped, so this was
 * never a read leak — but the write paths accepted any well-formed UUID and
 * happily stored a row pointing at somebody else's project.
 *
 * `null` and `undefined` mean "global" / "unchanged" and are always valid.
 */
export async function isProjectInWorkspace(
  workspaceId: string,
  projectId: string | null | undefined,
): Promise<boolean> {
  if (projectId === null || projectId === undefined) return true;
  const project = await getProjectById(workspaceId, projectId);
  return project !== null;
}
