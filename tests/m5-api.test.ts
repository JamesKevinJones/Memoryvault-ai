import { describe, expect, it, vi, beforeEach } from "vitest";
import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";
import { createProjectBodySchema } from "@/features/projects/api/project-schemas";
import { createTaskBodySchema } from "@/features/tasks/api/task-schemas";
import { createDocumentBodySchema } from "@/features/documents/api/document-schemas";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/features/auth/use-cases/ensure-workspace", () => ({
  ensureWorkspace: vi.fn(),
}));
vi.mock("@/repositories/projects", () => ({
  listProjects: vi.fn().mockResolvedValue([]),
  createProject: vi.fn(),
}));
vi.mock("@/repositories/tasks", () => ({
  listTasks: vi.fn().mockResolvedValue([]),
  createTask: vi.fn(),
}));
vi.mock("@/repositories/documents", () => ({
  listDocuments: vi.fn().mockResolvedValue([]),
  createDocument: vi.fn(),
}));

describe("M5 API schemas", () => {
  it("validates project create body", () => {
    expect(createProjectBodySchema.safeParse({ name: "Hackathon" }).success).toBe(
      true,
    );
    expect(createProjectBodySchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("validates task create body", () => {
    expect(createTaskBodySchema.safeParse({ title: "Ship demo" }).success).toBe(
      true,
    );
  });

  it("validates document create body", () => {
    expect(
      createDocumentBodySchema.safeParse({
        title: "Notes",
        body: "Content here",
      }).success,
    ).toBe(true);
  });
});

describe("M5 API unauthorized", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(null as never);
  });

  it("GET /api/v1/projects returns 401", async () => {
    const { GET } = await import("@/app/api/v1/projects/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/tasks returns 401", async () => {
    const { GET } = await import("@/app/api/v1/tasks/route");
    const res = await GET(new Request("http://localhost/api/v1/tasks"));
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/documents returns 401", async () => {
    const { GET } = await import("@/app/api/v1/documents/route");
    const res = await GET(new Request("http://localhost/api/v1/documents"));
    expect(res.status).toBe(401);
  });
});
