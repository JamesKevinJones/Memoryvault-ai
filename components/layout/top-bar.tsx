"use client";

import { useEffect, useState } from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { Bell, Search } from "lucide-react";
import { CommandPalette } from "@/components/layout/command-palette";

export function TopBar() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isCmdK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isCmdK) {
        event.preventDefault();
        setPaletteOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 px-6">
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="flex w-full max-w-sm items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-1.5 text-left text-sm text-muted-foreground transition-colors duration-150 hover:border-foreground/20"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="flex-1">Search…</span>
        <kbd className="shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-1.5">
        <PopoverPrimitive.Root>
          <PopoverPrimitive.Trigger className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground">
            <Bell className="size-4" />
          </PopoverPrimitive.Trigger>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Positioner side="bottom" align="end" sideOffset={10}>
              <PopoverPrimitive.Popup className="z-50 w-64 origin-[var(--transform-origin)] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
                <p className="text-sm font-medium">Notifications</p>
                <p className="mt-1.5 text-caption text-muted-foreground">
                  You&apos;re all caught up. New activity from your vault will appear here.
                </p>
              </PopoverPrimitive.Popup>
            </PopoverPrimitive.Positioner>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
