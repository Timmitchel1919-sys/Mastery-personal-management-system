"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { countUnreadNotifications } from "./notification-repository";

/**
 * Lightweight unread count for the topbar bell — a single bounded read, no reminder scan.
 * Re-reads when the pathname changes so the badge clears after visiting `/notifications`.
 */
export function useUnreadNotificationCount(pathKey: string): number {
  const { status } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    countUnreadNotifications().then(
      (n) => {
        if (!cancelled) setCount(n);
      },
      () => {
        if (!cancelled) setCount(0);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [status, pathKey]);

  return count;
}
