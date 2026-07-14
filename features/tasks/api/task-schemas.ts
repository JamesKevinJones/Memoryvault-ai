import { z } from "zod";

export const listTasksQuerySchema = z.object({
  projectId: z.union([z.literal("global"), z.string().uuid()]).optional(),
  status: z.enum(["open", "done"]).optional(),
});

export const createTaskBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  projectId: z.string().uuid().nullable().optional(),
});

export const updateTaskBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    status: z.enum(["open", "done"]).optional(),
    projectId: z.string().uuid().nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "at least one field required",
  });

export function parseListTasksQuery(searchParams: URLSearchParams) {
  const parsed = listTasksQuerySchema.safeParse({
    projectId: searchParams.get("projectId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });
  if (!parsed.success) return { ok: false as const };
  return { ok: true as const, data: parsed.data };
}
