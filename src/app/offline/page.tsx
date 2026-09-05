import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = { title: "Offline" };

/**
 * Served by the service worker when a navigation fails with no cached copy (Layer 19).
 * Deliberately plain: it must never imply that uncached cloud data is available offline.
 */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
      <WifiOff className="text-muted size-10" aria-hidden="true" />
      <h1 className="text-lg font-semibold">You&apos;re offline</h1>
      <p className="text-muted text-sm">
        Mastery needs a connection to load your plans, tasks, and other data. Reconnect and try
        again — pages you&apos;ve already opened may still work.
      </p>
      <Link
        href="/dashboard"
        className="border-border hover:bg-surface rounded-md border px-4 py-2 text-sm font-medium"
      >
        Try the dashboard
      </Link>
    </main>
  );
}
