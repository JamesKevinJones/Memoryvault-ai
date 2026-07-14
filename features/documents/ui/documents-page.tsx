"use client";

import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import type { Document } from "@/repositories/documents";

type DocumentsPageClientProps = {
  initialDocuments: Document[];
  projectId?: string;
};

export function DocumentsPageClient({
  initialDocuments,
  projectId,
}: DocumentsPageClientProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialDocuments[0]?.id ?? null,
  );

  const selected = documents.find((doc) => doc.id === selectedId) ?? null;

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          ...(projectId ? { projectId } : {}),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { document: Document };
      setDocuments((current) => [data.document, ...current]);
      setSelectedId(data.document.id);
      setTitle("");
      setBody("");
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <PageHeader
        title="Documents"
        description="Text knowledge captured in your vault."
        action={
          <Button type="button" onClick={() => setShowForm(true)}>
            <Plus data-icon="inline-start" />
            New document
          </Button>
        }
      />

      {showForm && (
        <Card
          padding="lg"
          className="animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <form onSubmit={handleCreate} className="space-y-3">
            <Input
              required
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              required
              rows={6}
              placeholder="Content"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save document"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Capture notes, snippets, and reference text for your vault."
          action={
            <Button type="button" onClick={() => setShowForm(true)}>
              <Plus data-icon="inline-start" />
              Add document
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <ul className="space-y-1">
            {documents.map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(doc.id)}
                  className={cn(
                    "w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150",
                    selectedId === doc.id
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  {doc.title}
                </button>
              </li>
            ))}
          </ul>
          {selected && (
            <Card padding="lg" className="animate-in fade-in duration-200">
              <h2 className="text-title font-semibold text-foreground">
                {selected.title}
              </h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {selected.body}
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
