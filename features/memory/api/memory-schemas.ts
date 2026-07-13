import { z } from "zod";
import { MEMORY_CATEGORIES } from "@/features/memory/types";

export const listMemoriesQuerySchema = z.object({
  projectId: z.union([z.literal("global"), z.string().uuid()]).optional(),
  category: z.enum(MEMORY_CATEGORIES).optional(),
  importance: z.coerce.number().int().min(0).max(100).optional(),
  q: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const createMemoryBodySchema = z.object({
  projectId: z.string().uuid().nullable().optional(),
  category: z.enum(MEMORY_CATEGORIES),
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  summary: z.string().nullable().optional(),
  importance: z.number().int().min(0).max(100).optional(),
  pinned: z.boolean().optional(),
});

export const updateMemoryBodySchema = z
  .object({
    projectId: z.string().uuid().nullable().optional(),
    category: z.enum(MEMORY_CATEGORIES).optional(),
    title: z.string().trim().min(1).optional(),
    content: z.string().trim().min(1).optional(),
    summary: z.string().nullable().optional(),
    importance: z.number().int().min(0).max(100).optional(),
    pinned: z.boolean().optional(),
    archived: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "at least one field required",
  });

export function parseListMemoriesQuery(
  searchParams: URLSearchParams,
):
  | { ok: true; data: z.infer<typeof listMemoriesQuerySchema> }
  | { ok: false } {
  const raw = Object.fromEntries(searchParams.entries());
  const parsed = listMemoriesQuerySchema.safeParse(raw);
  if (!parsed.success) return { ok: false };
  return { ok: true, data: parsed.data };
}
