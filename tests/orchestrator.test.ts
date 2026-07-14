import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  orchestratorBuildPrompt,
  orchestratorExtractMemories,
} from "@/ai/orchestrator";

vi.mock("@/ai/bedrock/generate", () => ({
  invokeConverse: vi.fn(),
  streamConverse: vi.fn(),
}));

vi.mock("@/repositories/ai-runs", () => ({
  recordAiRun: vi.fn(),
}));

describe("orchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("buildPrompt delegates to prompt builder", async () => {
    const pack = await orchestratorBuildPrompt({
      retrievedMemories: [],
      pinnedMemories: [],
      openTasks: [],
      recentMessages: [],
      userMessage: "Hello",
    });

    expect(pack.system).toContain("MemoryVault AI");
    expect(pack.messages).toEqual([{ role: "user", content: "Hello" }]);
  });

  it("extract parses Bedrock JSON output", async () => {
    const { invokeConverse } = await import("@/ai/bedrock/generate");
    vi.mocked(invokeConverse).mockResolvedValue(
      JSON.stringify({
        memories: [
          {
            title: "Preference",
            content: "Likes concise answers.",
            category: "preference",
            importance: 75,
          },
        ],
        tasks: [],
      }),
    );

    const result = await orchestratorExtractMemories(
      {
        workspaceId: "ws-1",
        userId: "user-1",
        conversationId: "conv-1",
      },
      {
        userMessage: "Keep it short",
        assistantMessage: "Will do.",
      },
    );

    expect(result.memories).toHaveLength(1);
    expect(result.memories[0].title).toBe("Preference");
  });
});
