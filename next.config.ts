import type { NextConfig } from "next";

// A stray package-lock.json in the parent directory makes Next infer the
// workspace root one level up, which nests the standalone output under an
// extra path segment and breaks the container COPY.
const projectRoot = process.cwd();

// Vercel builds and runs the app with its own packaging. `output: "standalone"`
// exists here only so the Dockerfile can ship a runtime image without the whole
// dependency tree — pinning the tracing root alongside it interferes with
// Vercel's builder, so both stay off when Vercel is doing the build.
const isVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  // Don't advertise the framework; it's free reconnaissance for an attacker
  // matching a deployment against version-specific advisories.
  poweredByHeader: false,

  ...(isVercel
    ? {}
    : {
        output: "standalone" as const,
        outputFileTracingRoot: projectRoot,
      }),

  turbopack: { root: projectRoot },

  // Security headers are set per-request in middleware.ts, because the CSP
  // carries a per-response nonce.
};

export default nextConfig;
