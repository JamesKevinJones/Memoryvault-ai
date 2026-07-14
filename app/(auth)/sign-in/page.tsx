import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";

function oauthMisconfigured() {
  const id = process.env.AUTH_GOOGLE_ID ?? "";
  const secret = process.env.AUTH_GOOGLE_SECRET ?? "";
  const looksPlaceholder = (v: string) =>
    !v || /your-|generate-|placeholder|changeme|xxx/i.test(v) || v.length < 8;
  return looksPlaceholder(id) || looksPlaceholder(secret);
}

function authCallbackUrl() {
  const base =
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
  return `${base}/api/auth/callback/google`;
}

const AUTH_ERROR_HINTS: Record<string, string> = {
  redirect_uri_mismatch:
    "Google rejected the redirect URI. Add the production callback URL below to your OAuth client's Authorized redirect URIs.",
  OAuthCallback:
    "Google OAuth callback failed. Confirm the redirect URI is listed in Google Cloud Console and try again.",
  Configuration:
    "Auth configuration is incomplete. Check AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, and AUTH_SECRET.",
  AccessDenied: "Google denied access. Grant the requested permissions and try again.",
  Verification: "Unable to verify the sign-in response. Try again.",
  MissingCSRF: "Sign-in session expired. Refresh the page and try again.",
};

type SignInPageProps = {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const setupNeeded = oauthMisconfigured();
  const callbackUrl = authCallbackUrl();
  const authError = params.error;
  const errorHint =
    (authError && AUTH_ERROR_HINTS[authError]) ||
    (authError ? `Sign-in failed (${authError}). Try again or check Google OAuth settings.` : null);

  // #region agent log
  if (authError) {
    fetch("http://127.0.0.1:7424/ingest/895eb080-adbb-425e-934a-f5fa10d587fb", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "602de8",
      },
      body: JSON.stringify({
        sessionId: "602de8",
        runId: "login-debug",
        hypothesisId: "A",
        location: "app/(auth)/sign-in/page.tsx:render",
        message: "sign-in page rendered with auth error",
        data: { authError, callbackUrlHost: new URL(callbackUrl).host },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    console.error(
      JSON.stringify({
        debugSessionId: "602de8",
        hypothesisId: "A",
        message: "sign-in_auth_error",
        authError,
        callbackUrl,
      }),
    );
  }
  // #endregion

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

        {errorHint ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground space-y-2"
          >
            <p className="font-medium">Couldn&apos;t complete Google sign-in</p>
            <p className="text-muted-foreground">{errorHint}</p>
            <p className="text-muted-foreground">
              Authorized redirect URI:{" "}
              <code className="break-all text-foreground">{callbackUrl}</code>
            </p>
          </div>
        ) : null}

        {setupNeeded ? (
          <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Google OAuth not configured</p>
            <p>
              Set <code className="text-foreground">AUTH_GOOGLE_ID</code> and{" "}
              <code className="text-foreground">AUTH_GOOGLE_SECRET</code> from Google Cloud
              Console.
            </p>
            <p>
              Redirect URI:{" "}
              <code className="break-all text-foreground">{callbackUrl}</code>
            </p>
          </div>
        ) : null}

        <form
          action={async () => {
            "use server";
            // #region agent log
            console.error(
              JSON.stringify({
                debugSessionId: "602de8",
                hypothesisId: "B",
                message: "signIn_google_invoked",
                callbackUrl: authCallbackUrl(),
              }),
            );
            // #endregion
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
