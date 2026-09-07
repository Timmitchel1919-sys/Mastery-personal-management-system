import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { Providers } from "@/providers";

export const metadata: Metadata = {
  title: {
    default: "Mastery",
    template: "%s · Mastery",
  },
  description: "AI-Powered Personal Operating System — Plan. Focus. Act. Grow.",
  applicationName: "Mastery",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Mastery",
    statusBarStyle: "default",
  },
  icons: {
    // All derived from the single approved app icon (public/brand/mastery-app-icon.png).
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f12" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="bg-background text-foreground min-h-full font-sans" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
