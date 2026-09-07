"use client";

import { useEffect, useState } from "react";
import { useMounted } from "@/hooks/use-mounted";

/** Live local date + time in the topbar. Minute precision; refreshes every 15s. */
export function LiveClock() {
  const mounted = useMounted();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  if (!mounted) return <span className="hidden w-32 sm:block" aria-hidden />;

  const date = now.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return (
    <span className="text-muted hidden items-center gap-1.5 text-xs tabular-nums sm:inline-flex">
      <span>{date}</span>
      <span aria-hidden="true" className="text-subtle">
        ·
      </span>
      <time className="text-foreground font-medium">{time}</time>
    </span>
  );
}
