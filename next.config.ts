import type { NextConfig } from "next";

// A stray package-lock.json in the parent directory makes Next infer the
// workspace root one level up, which nests the standalone output under an
// extra path segment and breaks the container COPY. Pin it to this project.
const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  // Don't advertise the framework; it's free reconnaissance for an attacker
  // matching a deployment against version-specific advisories.
  poweredByHeader: false,

  // Ships only the server and the modules it actually imports, so the
  // container image stops carrying the whole dependency tree.
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  turbopack: { root: projectRoot },

  // Security headers are set per-request in middleware.ts, because the CSP
  // carries a per-response nonce.
};

export default nextConfig;
