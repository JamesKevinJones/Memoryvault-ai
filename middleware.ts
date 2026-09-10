import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  STATIC_SECURITY_HEADERS,
  buildContentSecurityPolicy,
} from "@/lib/security-headers";

const APP_PREFIXES = [
  "/dashboard",
  "/chat",
  "/projects",
  "/tasks",
  "/documents",
  "/settings",
];

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Reject a state-changing API call whose Origin belongs to somebody else.
 *
 * Browsers attach Origin to every unsafe-method request, so a mismatch is a
 * cross-site attempt. A *missing* Origin is a non-browser client (cron, curl),
 * which cannot be tricked into riding a user's cookie, so it passes through —
 * those callers are gated by their own bearer check.
 */
function isCrossSiteWrite(req: Request, expectedOrigin: string): boolean {
  if (!UNSAFE_METHODS.has(req.method)) return false;
  const origin = req.headers.get("origin");
  if (!origin) return false;
  return origin !== expectedOrigin;
}

export default auth((req) => {
  const { pathname, origin } = req.nextUrl;

  if (
    pathname.startsWith("/api/v1") &&
    isCrossSiteWrite(req, origin)
  ) {
    return NextResponse.json({ error: "cross-site request" }, { status: 403 });
  }

  const isApp = APP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isApp && !req.auth?.user?.id) {
    const url = new URL("/sign-in", origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const nonce = crypto.randomUUID().replaceAll("-", "");
  const csp = buildContentSecurityPolicy(
    nonce,
    process.env.NODE_ENV === "development",
  );

  // Next reads the nonce back out of the CSP on the *request* headers in order
  // to stamp it onto its own inline scripts, so it has to go both ways.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("content-security-policy", csp);
  for (const [key, value] of STATIC_SECURITY_HEADERS) {
    res.headers.set(key, value);
  }
  return res;
});

export const config = {
  matcher: [
    /*
     * Everything except Auth.js's own routes and static assets — the headers
     * have to cover pages and APIs alike, not just the signed-in app shell.
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
