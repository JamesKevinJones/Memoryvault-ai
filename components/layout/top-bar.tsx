import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

type TopBarProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

export function TopBar({ user }: TopBarProps) {
  const displayName = user.name ?? user.email ?? "Account";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-8">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{displayName}</span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/sign-in" });
          }}
        >
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
