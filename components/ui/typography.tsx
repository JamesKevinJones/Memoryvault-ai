import { cn } from "@/lib/utils";

type TextProps = React.HTMLAttributes<HTMLElement> & {
  asChild?: React.ElementType;
};

/** Page title — 48–56px, tightest tracking, heaviest weight in the scale. */
export function Display({ className, as: Comp = "h1", ...props }: TextProps & { as?: React.ElementType }) {
  return (
    <Comp
      className={cn(
        "text-display font-semibold tracking-[var(--text-display--letter-spacing)] text-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** Section title — 28–32px. */
export function Title({ className, as: Comp = "h2", ...props }: TextProps & { as?: React.ElementType }) {
  return (
    <Comp
      className={cn(
        "text-title font-semibold tracking-[var(--text-title--letter-spacing)] text-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** Card / subsection title — 18–20px. */
export function Heading({ className, as: Comp = "h3", ...props }: TextProps & { as?: React.ElementType }) {
  return (
    <Comp
      className={cn(
        "text-heading font-medium tracking-[var(--text-heading--letter-spacing)] text-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** Body copy — 15–16px. */
export function Body({ className, as: Comp = "p", ...props }: TextProps & { as?: React.ElementType }) {
  return (
    <Comp
      className={cn("text-body leading-[var(--text-body--line-height)] text-foreground", className)}
      {...props}
    />
  );
}

/** Caption / meta text — 13px. */
export function Caption({ className, as: Comp = "span", ...props }: TextProps & { as?: React.ElementType }) {
  return (
    <Comp
      className={cn(
        "text-caption leading-[var(--text-caption--line-height)] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
