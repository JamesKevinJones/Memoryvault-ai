import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't advertise the framework; it's free reconnaissance for an attacker
  // matching a deployment against version-specific advisories.
  poweredByHeader: false,

  // Security headers are set per-request in middleware.ts, because the CSP
  // carries a per-response nonce.
};

export default nextConfig;
