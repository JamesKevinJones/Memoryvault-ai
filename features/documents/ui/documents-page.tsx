"use client";

import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import type { Document } from "@/repositories/documents";

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors duration-200 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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
        <form
          onSubmit={handleCreate}
          className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-3 rounded-xl border border-border bg-card p-5"
        >
          <input
            required
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
          <textarea
            required
            rows={6}
            placeholder="Content"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={inputClass}
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
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(doc.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-all duration-200 ${
                    selectedId === doc.id
                      ? "border-foreground/30 bg-muted/40"
                      : "border-border hover:bg-muted/20"
                  }`}
                >
                  {doc.title}
                </button>
              </li>
            ))}
          </ul>
          {selected && (
            <article className="animate-in fade-in duration-200 rounded-xl border border-border bg-card p-6">
              <h2 className="font-heading text-2xl font-semibold">
                {selected.title}
              </h2>
              <p className="mt-4 whitespace-pre-wrap text-sm text-foreground/90">
                {selected.body}
              </p>
            </article>
          )}
        </div>
      )}
    </div>
  );
}
