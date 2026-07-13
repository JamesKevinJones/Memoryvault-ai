import { describe, expect, it } from "vitest";

describe("env", () => {
  it("requires DATABASE_URL", async () => {
    const prev = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const { loadEnv } = await import("@/lib/env");
      expect(() => loadEnv({ ...process.env, DATABASE_URL: undefined })).toThrow();
    } finally {
      if (prev !== undefined) process.env.DATABASE_URL = prev;
    }
  });
});
