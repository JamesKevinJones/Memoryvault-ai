/**
 * Security headers, built per-request so the CSP can carry a fresh nonce.
 *
 * Next injects its own bootstrap/hydration scripts inline; giving them a nonce
 * is what lets script-src stay free of 'unsafe-inline'. Next reads the nonce
 * back out of this very header, so it must be generated here and travel with
 * the request.
 */
export function buildContentSecurityPolicy(
  nonce: string,
  isDev: boolean,
): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    // Turbopack's HMR client is eval-based; production never gets this.
    isDev ? "'unsafe-eval'" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    // next/font and Tailwind emit inline style attributes during hydration.
    "style-src 'self' 'unsafe-inline'",
    // Google serves signed-in users' avatars from its own CDN hosts.
    "img-src 'self' blob: data: https://lh3.googleusercontent.com https://*.googleusercontent.com",
    "font-src 'self' data:",
    // Auth.js posts to Google's token and userinfo endpoints server-side, so
    // the browser only ever needs same-origin XHR and the dev websocket.
    isDev ? "connect-src 'self' ws: wss:" : "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self' https://accounts.google.com",
    "base-uri 'self'",
    "object-src 'none'",
    isDev ? "" : "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .join("; ");
}

export const STATIC_SECURITY_HEADERS: Array<[string, string]> = [
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()"],
  [
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  ],
  ["X-DNS-Prefetch-Control", "off"],
];
