"use client";

import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ChatCitation = {
  memoryId: string;
  title: string;
  score?: number;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
};

const inputClass =
  "w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function parseSseChunk(buffer: string): {
  events: Array<{ event: string; data: string }>;
  rest: string;
} {
  const events: Array<{ event: string; data: string }> = [];
  const parts = buffer.split("\n\n");

  for (let i = 0; i < parts.length - 1; i += 1) {
    const block = parts[i];
    const eventLine = block.match(/^event: (.+)$/m);
    const dataLine = block.match(/^data: (.+)$/m);
    if (eventLine && dataLine) {
      events.push({ event: eventLine[1], data: dataLine[1] });
    }
  }

  return { events, rest: parts[parts.length - 1] ?? "" };
}

export function ChatWorkspace() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [citations, setCitations] = useState<ChatCitation[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const assistantIdRef = useRef<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || streaming) return;

    setError(null);
    setInput("");
    setStreaming(true);
    setCitations([]);

    const userId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();
    assistantIdRef.current = assistantId;

    setMessages((current) => [
      ...current,
      { id: userId, role: "user", content: message },
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          ...(conversationId ? { conversationId } : {}),
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Chat request failed");
      }

      if (!res.body) throw new Error("Empty response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSseChunk(buffer);
        buffer = parsed.rest;

        for (const sse of parsed.events) {
          const payload = JSON.parse(sse.data) as Record<string, unknown>;

          if (sse.event === "token" && typeof payload.text === "string") {
            const chunk = payload.text;
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantIdRef.current
                  ? { ...item, content: item.content + chunk }
                  : item,
              ),
            );
          }

          if (sse.event === "metadata") {
            if (typeof payload.conversationId === "string") {
              setConversationId(payload.conversationId);
            }
            if (Array.isArray(payload.citations)) {
              const nextCitations = payload.citations as ChatCitation[];
              setCitations(nextCitations);
              setMessages((current) =>
                current.map((item) =>
                  item.id === assistantIdRef.current
                    ? { ...item, citations: nextCitations }
                    : item,
                ),
              );
            }
          }

          if (sse.event === "error") {
            throw new Error(
              typeof payload.error === "string"
                ? payload.error
                : "generation failed",
            );
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
      setMessages((current) =>
        current.filter((item) => item.id !== assistantIdRef.current),
      );
    } finally {
      setStreaming(false);
      assistantIdRef.current = null;
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground">
          Chat
        </h1>
        <p className="text-sm text-muted-foreground">
          Hot-path chat with memory retrieval and source citations.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="flex min-h-[60vh] flex-col rounded-xl border border-border bg-card">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ask anything — relevant memories are retrieved automatically.
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                      : "max-w-[90%] rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground"
                  }
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-border p-4"
          >
            {error && (
              <p className="mb-2 text-xs text-destructive">{error}</p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                className={inputClass}
                rows={2}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Message MemoryVault…"
                disabled={streaming}
              />
              <Button type="submit" disabled={streaming || !input.trim()}>
                <Send data-icon="inline-start" />
                Send
              </Button>
            </div>
          </form>
        </section>

        <aside className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Memory context
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Sources cited for the latest response.
          </p>
          <ul className="mt-4 space-y-3">
            {citations.length === 0 ? (
              <li className="text-sm text-muted-foreground">
                {streaming ? "Retrieving…" : "No citations yet."}
              </li>
            ) : (
              citations.map((citation) => (
                <li
                  key={citation.memoryId}
                  className="rounded-lg border border-border bg-muted/20 px-3 py-2"
                >
                  <p className="text-sm font-medium text-foreground">
                    {citation.title}
                  </p>
                  {citation.score !== undefined && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      relevance {(citation.score * 100).toFixed(0)}%
                    </p>
                  )}
                </li>
              ))
            )}
          </ul>
        </aside>
      </div>
    </div>
  );
}
