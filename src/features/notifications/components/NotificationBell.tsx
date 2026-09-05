"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui";
import { useUnreadNotificationCount } from "../use-unread-count";

export function NotificationBell() {
  const pathname = usePathname();
  const count = useUnreadNotificationCount(pathname ?? "/");
  const label = count > 0 ? `Notifications, ${count} unread` : "Notifications";

  return (
    <Button asChild variant="ghost" size="icon" aria-label={label} className="relative">
      <Link href="/notifications">
        <Bell />
        {count > 0 ? (
          <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
