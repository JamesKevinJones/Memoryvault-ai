import { describe, expect, it } from "vitest";
import {
  orchestratorBuildPrompt,
  orchestratorExtractMemories,
} from "@/ai/orchestrator";

describe("orchestrator", () => {
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

  it("extract still throws until M4", () => {
    expect(() => orchestratorExtractMemories()).toThrow(/M4/);
  });
});
