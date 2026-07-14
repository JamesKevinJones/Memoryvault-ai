"use client";

import Link from "next/link";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/features/auth/actions/sign-out";

type ProfileMenuProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  collapsed?: boolean;
};

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function ProfileMenu({ user, collapsed }: ProfileMenuProps) {
  const displayName = user.name ?? user.email ?? "Account";

  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors duration-150 hover:bg-sidebar-accent/60",
          collapsed && "justify-center px-0",
        )}
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className="size-7 shrink-0 rounded-full object-cover ring-1 ring-sidebar-border"
          />
        ) : (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
            {initials(user.name, user.email)}
          </span>
        )}
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-sidebar-foreground">
              {displayName}
            </span>
            {user.email && (
              <span className="block truncate text-[11px] text-sidebar-foreground/50">
                {user.email}
              </span>
            )}
          </span>
        )}
      </MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner side="top" align="start" sideOffset={8}>
          <MenuPrimitive.Popup className="z-50 min-w-48 origin-[var(--transform-origin)] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <MenuPrimitive.Item
              render={<Link href="/settings" />}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-foreground/90 outline-none transition-colors duration-100 data-[highlighted]:bg-muted"
            >
              <Settings className="size-4 text-muted-foreground" />
              Settings
            </MenuPrimitive.Item>
            <div className="my-1 h-px bg-border" role="separator" />
            <MenuPrimitive.Item
              onClick={() => void signOutAction()}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-destructive outline-none transition-colors duration-100 data-[highlighted]:bg-destructive/10"
            >
              <LogOut className="size-4" />
              Sign out
            </MenuPrimitive.Item>
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}
