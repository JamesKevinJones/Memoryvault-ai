import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/session", () => ({
  requireAuth: vi.fn(),
  requireWorkspaceId: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true })),
  rateLimitedResponse: vi.fn(),
}));

vi.mock("@/repositories/projects", () => ({
  getProjectById: vi.fn(),
  listProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

vi.mock("@/repositories/tasks", () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  getTaskById: vi.fn(),
  listTasks: vi.fn(),
  listOpenTasks: vi.fn(),
}));

const ALICE = "ws-alice";
const BOBS_PROJECT = "11111111-2222-4333-8444-555555555555";

/**
 * projectId arrives from the client as a bare UUID. Being well-formed is not
 * being owned — before this guard, a write path stored whatever project id it
 * was handed, pointing one tenant's rows at another tenant's project.
 */
describe("cross-workspace project references are rejected on write", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses to create a task under another workspace's project", async () => {
    const { requireWorkspaceId } = await import("@/lib/session");
    const { getProjectById } = await import("@/repositories/projects");
    const { createTask } = await import("@/repositories/tasks");
    const { handleCreateTask } = await import(
      "@/features/tasks/api/task-handlers"
    );

    vi.mocked(requireWorkspaceId).mockResolvedValue(ALICE);
    // Scoped lookup finds nothing, because the project is Bob's.
    vi.mocked(getProjectById).mockResolvedValue(null as never);

    const result = await handleCreateTask({
      title: "Sneak into Bob's project",
      projectId: BOBS_PROJECT,
    });

    expect(result).toEqual({
      ok: false,
      status: 404,
      body: { error: "not found" },
    });
    expect(getProjectById).toHaveBeenCalledWith(ALICE, BOBS_PROJECT);
    expect(createTask).not.toHaveBeenCalled();
  });

  it("still allows a global task, where no project is referenced at all", async () => {
    const { requireWorkspaceId } = await import("@/lib/session");
    const { getProjectById } = await import("@/repositories/projects");
    const { createTask } = await import("@/repositories/tasks");
    const { handleCreateTask } = await import(
      "@/features/tasks/api/task-handlers"
    );

    vi.mocked(requireWorkspaceId).mockResolvedValue(ALICE);
    vi.mocked(createTask).mockResolvedValue({ id: "task-1" } as never);

    const result = await handleCreateTask({ title: "A global task" });

    expect(result.ok).toBe(true);
    // No ownership query needed: there is no project to own.
    expect(getProjectById).not.toHaveBeenCalled();
    expect(createTask).toHaveBeenCalled();
  });

  it("allows a project the caller does own", async () => {
    const { requireWorkspaceId } = await import("@/lib/session");
    const { getProjectById } = await import("@/repositories/projects");
    const { createTask } = await import("@/repositories/tasks");
    const { handleCreateTask } = await import(
      "@/features/tasks/api/task-handlers"
    );

    vi.mocked(requireWorkspaceId).mockResolvedValue(ALICE);
    vi.mocked(getProjectById).mockResolvedValue({
      id: BOBS_PROJECT,
      workspaceId: ALICE,
    } as never);
    vi.mocked(createTask).mockResolvedValue({ id: "task-2" } as never);

    const result = await handleCreateTask({
      title: "My own project task",
      projectId: BOBS_PROJECT,
    });

    expect(result.ok).toBe(true);
    expect(createTask).toHaveBeenCalled();
  });
});
