import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Build must fail on type errors — never silently ignore them.
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
