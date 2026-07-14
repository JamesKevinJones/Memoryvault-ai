import { describe, expect, it } from "vitest";
import {
  orchestratorBuildPrompt,
  orchestratorExtractMemories,
  orchestratorGenerate,
} from "@/ai/orchestrator";

describe("orchestrator M3/M4 stubs", () => {
  it("throws for unimplemented operations", () => {
    expect(() => orchestratorBuildPrompt()).toThrow(/M3/);
    expect(() => orchestratorGenerate()).toThrow(/M3/);
    expect(() => orchestratorExtractMemories()).toThrow(/M4/);
  });
});
