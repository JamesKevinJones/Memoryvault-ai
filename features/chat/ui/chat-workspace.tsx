"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, Plus, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

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
  "w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15";

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

function RailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border py-4 first:pt-0 last:border-0 last:pb-0">
      <p className="mb-3 text-caption font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </p>
      {children}
    </div>
  );
}

export function ChatWorkspace({ projectId }: { projectId?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [citations, setCitations] = useState<ChatCitation[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedMemories, setExtractedMemories] = useState<
    Array<{ id: string; title: string; content: string; category: string }>
  >([]);
  const [pollingExtraction, setPollingExtraction] = useState(false);
  const assistantIdRef = useRef<string | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function pollExtractedMemories(activeConversationId: string) {
    setPollingExtraction(true);
    try {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const res = await fetch(
          `/api/v1/memories?sourceConversationId=${activeConversationId}&limit=20`,
        );
        if (!res.ok) continue;
        const data = (await res.json()) as {
          items: Array<{
            id: string;
            title: string;
            content: string;
            category: string;
          }>;
        };
        if (data.items.length > 0) {
          setExtractedMemories(data.items);
          return;
        }
      }
    } finally {
      setPollingExtraction(false);
    }
  }

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
          ...(projectId ? { projectId } : {}),
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
      let activeConversationId = conversationId;

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
              activeConversationId = payload.conversationId;
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

      if (activeConversationId) {
        void pollExtractedMemories(activeConversationId);
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
      <PageHeader
        title="Chat"
        description={
          projectId
            ? "Project-scoped chat with memory retrieval and citations."
            : "Hot-path chat with memory retrieval and source citations."
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card padding="none" className="flex min-h-[65vh] flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-accent">
                  <Sparkles className="size-4.5 text-accent-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Ask anything — relevant memories are retrieved automatically.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex flex-col gap-1", message.role === "user" && "items-end")}
                >
                  <span className="px-1 text-caption text-muted-foreground">
                    {message.role === "user" ? "You" : "MemoryVault"}
                  </span>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    <p className="whitespace-pre-wrap">
                      {message.content || (streaming ? "…" : "")}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={scrollAnchorRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border p-4">
            {error && <p className="mb-2 text-caption text-destructive">{error}</p>}
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
        </Card>

        <Card padding="lg" className="h-fit">
          <RailSection title="Sources">
            <ul className="space-y-2">
              {citations.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  {streaming ? "Retrieving…" : "No citations yet."}
                </li>
              ) : (
                citations.map((citation) => (
                  <li
                    key={citation.memoryId}
                    className="rounded-lg bg-muted/40 px-2.5 py-2"
                  >
                    <p className="truncate text-sm font-medium text-foreground">
                      {citation.title}
                    </p>
                    {citation.score !== undefined && (
                      <p className="mt-0.5 text-caption text-muted-foreground">
                        relevance {(citation.score * 100).toFixed(0)}%
                      </p>
                    )}
                  </li>
                ))
              )}
            </ul>
          </RailSection>

          <RailSection title="Related knowledge">
            <ul className="space-y-2">
              {extractedMemories.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  {pollingExtraction
                    ? "Extracting memories…"
                    : "New memories from this chat will appear here."}
                </li>
              ) : (
                extractedMemories.map((memory) => (
                  <li key={memory.id} className="rounded-lg bg-muted/40 px-2.5 py-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {memory.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-caption text-muted-foreground">
                      {memory.content}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </RailSection>

          <RailSection title="Suggested actions">
            <div className="flex flex-col gap-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors duration-150 hover:bg-muted"
              >
                <LayoutDashboard className="size-3.5 text-muted-foreground" />
                Open vault dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setConversationId(null);
                  setCitations([]);
                  setExtractedMemories([]);
                }}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors duration-150 hover:bg-muted"
              >
                <Plus className="size-3.5 text-muted-foreground" />
                Start a new conversation
              </button>
            </div>
          </RailSection>
        </Card>
      </div>
    </div>
  );
}
