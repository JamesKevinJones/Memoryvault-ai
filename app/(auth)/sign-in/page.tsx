import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";

function oauthMisconfigured() {
  const id = process.env.AUTH_GOOGLE_ID ?? "";
  const secret = process.env.AUTH_GOOGLE_SECRET ?? "";
  const looksPlaceholder = (v: string) =>
    !v || /your-|generate-|placeholder|changeme|xxx/i.test(v) || v.length < 8;
  return looksPlaceholder(id) || looksPlaceholder(secret);
}

export default function SignInPage() {
  const setupNeeded = oauthMisconfigured();

  return (
    <main className="min-h-screen grid place-items-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">MemoryVault AI</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Your vault awaits
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Sign in to open your persistent memory workspace.
          </p>
        </div>
        {setupNeeded ? (
          <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Google OAuth not configured</p>
            <p>
              Replace <code className="text-foreground">AUTH_GOOGLE_ID</code> and{" "}
              <code className="text-foreground">AUTH_GOOGLE_SECRET</code> in{" "}
              <code className="text-foreground">.env</code> with real credentials from
              Google Cloud Console, then restart <code className="text-foreground">npm run dev</code>.
            </p>
            <p>
              Redirect URI:{" "}
              <code className="text-foreground">http://localhost:3000/api/auth/callback/google</code>
            </p>
          </div>
        ) : null}
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <Button type="submit" className="w-full" disabled={setupNeeded}>
            Continue with Google
          </Button>
        </form>
      </div>
    </main>
  );
}
