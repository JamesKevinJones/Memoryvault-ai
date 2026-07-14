import { z } from "zod";

export const chatBodySchema = z.object({
  message: z.string().trim().min(1).max(8000),
  conversationId: z.string().uuid().optional(),
  projectId: z
    .union([z.string().uuid(), z.literal("global")])
    .optional(),
});

export type ChatBody = z.infer<typeof chatBodySchema>;
