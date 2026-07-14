import { z } from "zod";

export const listDocumentsQuerySchema = z.object({
  projectId: z.union([z.literal("global"), z.string().uuid()]).optional(),
});

export const createDocumentBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1),
  projectId: z.string().uuid().nullable().optional(),
});

export const updateDocumentBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    body: z.string().trim().min(1).optional(),
    projectId: z.string().uuid().nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "at least one field required",
  });

export function parseListDocumentsQuery(searchParams: URLSearchParams) {
  const parsed = listDocumentsQuerySchema.safeParse({
    projectId: searchParams.get("projectId") ?? undefined,
  });
  if (!parsed.success) return { ok: false as const };
  return { ok: true as const, data: parsed.data };
}
