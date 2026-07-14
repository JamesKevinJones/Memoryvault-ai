import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: "display" | "title";
};

export function PageHeader({
  title,
  description,
  action,
  className,
  size = "display",
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200",
        className,
      )}
    >
      <div className="space-y-1.5">
        <h1
          className={cn(
            "font-semibold tracking-[-0.02em] text-foreground",
            size === "display" ? "text-display" : "text-title",
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="text-body text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
