import { z } from "zod";
import { MEMORY_CATEGORIES } from "@/features/memory/types";
import type { ExtractResult } from "@/ai/types";

/**
 * Caps are load-bearing, not cosmetic. Every extracted memory costs one
 * Bedrock embedding call in the cold path, so an unbounded array turns a
 * single chat turn into arbitrary spend and arbitrary rows. The model is
 * not a trusted producer here — its output is attacker-influenceable via
 * whatever text the user pasted into the conversation.
 */
const MAX_EXTRACTED_MEMORIES = 10;
const MAX_EXTRACTED_TASKS = 10;
const MAX_MEMORY_TITLE_CHARS = 200;
const MAX_MEMORY_CONTENT_CHARS = 4000;

/** Non-empty text, truncated to a ceiling rather than rejected at it. */
const boundedText = (max: number) =>
  z.string().trim().min(1).transform((value) => value.slice(0, max));

const extractionSchema = z.object({
  memories: z
    .array(
      z.object({
        title: boundedText(MAX_MEMORY_TITLE_CHARS),
        content: boundedText(MAX_MEMORY_CONTENT_CHARS),
        category: z.enum(MEMORY_CATEGORIES),
        importance: z.number().int().min(0).max(100),
        relatedTitles: z.array(boundedText(MAX_MEMORY_TITLE_CHARS)).optional(),
      }),
    )
    .default([]),
  tasks: z
    .array(
      z.object({
        title: boundedText(MAX_MEMORY_TITLE_CHARS),
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
    return {
      memories: parsed.data.memories.slice(0, MAX_EXTRACTED_MEMORIES),
      tasks: parsed.data.tasks.slice(0, MAX_EXTRACTED_TASKS),
    };
  } catch {
    return { memories: [], tasks: [] };
  }
}
