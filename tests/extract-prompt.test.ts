import { describe, expect, it } from "vitest";
import {
  buildExtractionPrompt,
  parseExtractionResult,
} from "@/ai/prompts/extract";

describe("extract prompt", () => {
  it("builds JSON extraction instructions", () => {
    const prompt = buildExtractionPrompt({
      userMessage: "I prefer dark mode",
      assistantMessage: "Got it, I'll remember that.",
    });

    expect(prompt.system).toContain("valid JSON");
    expect(prompt.messages[0].content).toContain("I prefer dark mode");
  });

  it("parses valid extraction JSON", () => {
    const result = parseExtractionResult(`
      Here is the result:
      {
        "memories": [
          {
            "title": "UI preference",
            "content": "User prefers dark mode.",
            "category": "preference",
            "importance": 80,
            "relatedTitles": []
          }
        ],
        "tasks": [{ "title": "Enable dark mode in settings" }]
      }
    `);

    expect(result.memories).toHaveLength(1);
    expect(result.memories[0].title).toBe("UI preference");
    expect(result.tasks).toHaveLength(1);
  });

  it("returns empty arrays for invalid JSON", () => {
    expect(parseExtractionResult("not json")).toEqual({
      memories: [],
      tasks: [],
    });
  });
});
