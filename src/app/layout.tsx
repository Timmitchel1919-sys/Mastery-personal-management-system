import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/providers";

export const metadata: Metadata = {
  title: {
    default: "Mastery",
    template: "%s · Mastery",
  },
  description: "AI-Powered Personal Operating System — Plan. Focus. Act. Grow.",
  applicationName: "Mastery",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="bg-background text-foreground min-h-full font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
