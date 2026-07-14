"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Brain,
  CheckSquare,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { Tooltip } from "@/components/ui/tooltip";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/documents", label: "Documents", icon: FileText },
] as const;

type SidebarProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

const COLLAPSE_KEY = "mv-sidebar-collapsed";

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSE_KEY);
    setCollapsed(stored === "1");
    setReady(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 76 : 244 }}
      transition={{ duration: ready ? 0.2 : 0, ease: [0.4, 0, 0.2, 1] }}
      className="flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar py-5"
    >
      <div
        className={cn(
          "mb-6 flex items-center gap-2.5 px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Brain className="size-4.5" strokeWidth={2.25} />
        </div>
        {!collapsed && (
          <span className="truncate text-[15px] font-semibold tracking-tight text-sidebar-foreground">
            MemoryVault
          </span>
        )}
      </div>

      <nav className={cn("flex flex-1 flex-col gap-0.5", collapsed ? "px-3" : "px-3")}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const link = (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                collapsed && "justify-center px-0 py-2.5",
                active
                  ? "font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/65 hover:text-sidebar-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-indicator"
                  className="absolute inset-0 rounded-lg bg-sidebar-accent"
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                />
              )}
              <Icon className="relative z-10 size-[17px] shrink-0" strokeWidth={2} />
              {!collapsed && <span className="relative z-10 truncate">{label}</span>}
            </Link>
          );

          if (!collapsed) return link;

          return (
            <Tooltip key={href} content={label} side="right">
              {link}
            </Tooltip>
          );
        })}
      </nav>

      <div className="mt-4 flex flex-col gap-1 border-t border-sidebar-border px-3 pt-4">
        {collapsed ? (
          <Tooltip content="Expand sidebar" side="right">
            <button
              type="button"
              onClick={toggleCollapsed}
              className="flex items-center justify-center rounded-lg px-0 py-2 text-sidebar-foreground/50 transition-colors duration-150 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              aria-label="Expand sidebar"
            >
              <ChevronsRight className="size-[15px]" />
            </button>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/50 transition-colors duration-150 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft className="size-[15px]" />
            <span>Collapse</span>
          </button>
        )}
        <ProfileMenu user={user} collapsed={collapsed} />
      </div>
    </motion.aside>
  );
}
