import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
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
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <Button type="submit" className="w-full">
            Continue with Google
          </Button>
        </form>
      </div>
    </main>
  );
}
