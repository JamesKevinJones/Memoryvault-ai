import { describe, expect, it, vi, beforeEach } from "vitest";
import { chatBodySchema } from "@/features/chat/api/chat-schemas";
import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/features/auth/use-cases/ensure-workspace", () => ({
  ensureWorkspace: vi.fn(),
}));

vi.mock("@/features/chat/use-cases/send-chat-message", () => ({
  prepareChatTurn: vi.fn(),
  finalizeChatTurn: vi.fn(),
}));

describe("chat API validation", () => {
  it("accepts valid chat body", () => {
    const parsed = chatBodySchema.safeParse({
      message: "Hello",
      conversationId: "550e8400-e29b-41d4-a716-446655440000",
      projectId: "global",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects empty message", () => {
    expect(chatBodySchema.safeParse({ message: "   " }).success).toBe(false);
  });
});

describe("POST /api/v1/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for malformed JSON", async () => {
    const { POST } = await import("@/app/api/v1/chat/route");
    const res = await POST(
      new Request("http://localhost/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not-json",
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid json" });
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const { POST } = await import("@/app/api/v1/chat/route");
    const res = await POST(
      new Request("http://localhost/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Hi" }),
      }),
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("streams tokens and metadata when authenticated", async () => {
    const { prepareChatTurn, finalizeChatTurn } = await import(
      "@/features/chat/use-cases/send-chat-message"
    );

    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
      expires: new Date(Date.now() + 86_400_000).toISOString(),
    } as never);
    vi.mocked(ensureWorkspace).mockResolvedValue({
      workspaceId: "ws-1",
      name: "My Vault",
    });

    vi.mocked(prepareChatTurn).mockResolvedValue({
      ctx: {
        workspaceId: "ws-1",
        userId: "user-1",
        conversationId: "conv-1",
      },
      conversationId: "conv-1",
      userMessageId: "user-msg-1",
      citations: [{ memoryId: "mem-1", title: "Deploy", score: 0.9 }],
      stream: (async function* () {
        yield "Hello";
        yield " world";
      })(),
    });

    vi.mocked(finalizeChatTurn).mockResolvedValue({
      assistantMessageId: "asst-1",
      conversationId: "conv-1",
      citations: [{ memoryId: "mem-1", title: "Deploy", score: 0.9 }],
    });

    const { POST } = await import("@/app/api/v1/chat/route");
    const res = await POST(
      new Request("http://localhost/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Hi" }),
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");

    const text = await res.text();
    expect(text).toContain('event: token');
    expect(text).toContain('"Hello"');
    expect(text).toContain('event: metadata');
    expect(text).toContain('"mem-1"');
    expect(text).toContain('event: done');
  });
});
