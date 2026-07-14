"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  CheckSquare,
  FileText,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SearchHit = {
  memoryId: string;
  title: string;
  category: string;
};

const staticCommands = [
  { href: "/dashboard", label: "Go to Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Go to Chat", icon: MessageSquare },
  { href: "/projects", label: "Go to Projects", icon: FolderKanban },
  { href: "/tasks", label: "Go to Tasks", icon: CheckSquare },
  { href: "/documents", label: "Go to Documents", icon: FileText },
  { href: "/settings", label: "Go to Settings", icon: Settings },
] as const;

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHits([]);
    }
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setHits([]);
      return;
    }
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/v1/search?${new URLSearchParams({ q: trimmed, limit: "6" })}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { items: SearchHit[] };
        setHits(data.items);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const navigate = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router],
  );

  const filteredCommands = staticCommands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <DialogPrimitive.Popup
          initialFocus={inputRef}
          className="fixed top-[18%] left-1/2 z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl transition-[transform,opacity] duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search memories or jump to a page.
          </DialogPrimitive.Description>
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search memories, or jump to a page…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <kbd className="shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 text-caption text-muted-foreground">
              Esc
            </kbd>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {query.trim() && (
              <div className="mb-1 px-2 py-1 text-caption font-medium text-muted-foreground">
                {searching ? "Searching…" : "Memories"}
              </div>
            )}
            {query.trim() && !searching && hits.length === 0 && (
              <p className="px-2 py-3 text-sm text-muted-foreground">No memories found.</p>
            )}
            {hits.map((hit) => (
              <button
                key={hit.memoryId}
                type="button"
                onClick={() => navigate(`/dashboard?focus=${hit.memoryId}`)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors duration-100 hover:bg-muted"
              >
                <span className="min-w-0 flex-1 truncate">{hit.title}</span>
                <span className="shrink-0 text-caption text-muted-foreground">
                  {hit.category}
                </span>
              </button>
            ))}

            {filteredCommands.length > 0 && (
              <>
                <div className="mt-2 mb-1 px-2 py-1 text-caption font-medium text-muted-foreground">
                  Navigate
                </div>
                {filteredCommands.map(({ href, label, icon: Icon }) => (
                  <button
                    key={href}
                    type="button"
                    onClick={() => navigate(href)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors duration-100 hover:bg-muted",
                    )}
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    {label}
                  </button>
                ))}
              </>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
