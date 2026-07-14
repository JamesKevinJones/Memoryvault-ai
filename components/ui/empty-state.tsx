import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in duration-200 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/60 px-8 py-16 text-center",
        className,
      )}
    >
      <div className="mb-4 rounded-full bg-muted p-3">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-heading font-medium text-foreground">{title}</h2>
      <p className="mt-2 max-w-sm text-body text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
