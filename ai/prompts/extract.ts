import { z } from "zod";
import { MEMORY_CATEGORIES } from "@/features/memory/types";
import type { ExtractResult } from "@/ai/types";

const extractionSchema = z.object({
  memories: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        content: z.string().trim().min(1),
        category: z.enum(MEMORY_CATEGORIES),
        importance: z.number().int().min(0).max(100),
        relatedTitles: z.array(z.string()).optional(),
      }),
    )
    .default([]),
  tasks: z
    .array(
      z.object({
        title: z.string().trim().min(1),
      }),
    )
    .default([]),
});

export function buildExtractionPrompt(input: {
  userMessage: string;
  assistantMessage: string;
}): { system: string; messages: Array<{ role: "user"; content: string }> } {
  const system = [
    "You extract durable long-term memories and actionable tasks from chat turns.",
    "Return ONLY valid JSON with this shape:",
    '{"memories":[{"title":"","content":"","category":"fact|preference|note|task_signal|project_info","importance":0-100,"relatedTitles":[]}],"tasks":[{"title":""}]}',
    "Rules:",
    "- Extract only facts, preferences, or follow-ups worth remembering across sessions.",
    "- Skip greetings, filler, and ephemeral chat.",
    "- Use task_signal for actionable reminders; also add matching tasks entries.",
    "- relatedTitles links memories that reference each other by title.",
    "- importance: 80+ for critical facts/preferences, 40-70 for useful notes, below 40 for minor.",
  ].join("\n");

  const messages = [
    {
      role: "user" as const,
      content: [
        "Extract memories and tasks from this turn:",
        "",
        `User: ${input.userMessage}`,
        `Assistant: ${input.assistantMessage}`,
      ].join("\n"),
    },
  ];

  return { system, messages };
}

export function parseExtractionResult(raw: string): ExtractResult {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { memories: [], tasks: [] };
  }

  try {
    const parsed = extractionSchema.safeParse(JSON.parse(jsonMatch[0]));
    if (!parsed.success) {
      return { memories: [], tasks: [] };
    }
    return parsed.data;
  } catch {
    return { memories: [], tasks: [] };
  }
}
