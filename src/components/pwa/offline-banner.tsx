"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "./use-online-status";

/** A thin fixed bar shown while the browser is offline. Non-blocking. */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      className="bg-warning text-warning-foreground fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium"
    >
      <WifiOff className="size-3.5" aria-hidden="true" />
      You&apos;re offline. Changes won&apos;t be saved until you reconnect.
    </div>
  );
}
