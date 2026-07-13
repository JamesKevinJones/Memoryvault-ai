import { describe, expect, it } from "vitest";
import { defaultWorkspaceName } from "@/features/auth/use-cases/ensure-workspace";

describe("ensureWorkspace", () => {
  it("exports defaultWorkspaceName helper", () => {
    expect(defaultWorkspaceName("Alice")).toBe("Alice's Vault");
    expect(defaultWorkspaceName(null)).toBe("My Vault");
    expect(defaultWorkspaceName(undefined)).toBe("My Vault");
  });

  // DB integration: ensureWorkspace requires live postgres; covered in manual OAuth sign-in flow.
});
