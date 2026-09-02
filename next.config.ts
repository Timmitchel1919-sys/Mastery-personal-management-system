import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Build must fail on type errors — never silently ignore them.
  typescript: { ignoreBuildErrors: false },
  // Static HTML/JS/CSS export to `out/`, deployed to Firebase Hosting (ADR-0015).
  // The app is a client-side SPA against the Firebase JS SDK — no server runtime is used.
  // Revisit (switch to App Hosting) if a layer introduces SSR, middleware, or server routes.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
