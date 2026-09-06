"use client";

import { Menu } from "lucide-react";
import { IconButton } from "@/components/ui";
import { UserMenu } from "@/features/auth";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { BreadcrumbTrail } from "./breadcrumb-trail";
import { SearchTrigger } from "./search-trigger";
import { useShell } from "./shell-context";

/**
 * Sticky top bar: mobile nav toggle, breadcrumbs, search, notifications, account.
 * Theme is set from Settings, not from here (removed from the bar on request).
 */
export function Topbar() {
  const { setDrawerOpen } = useShell();

  return (
    <header className="bg-background/80 border-border sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-3 backdrop-blur sm:px-4">
      <IconButton
        aria-label="Open navigation"
        className="lg:hidden"
        icon={<Menu />}
        onClick={() => setDrawerOpen(true)}
      />

      <div className="hidden min-w-0 flex-1 lg:block">
        <BreadcrumbTrail />
      </div>
      <div className="flex-1 lg:hidden" />

      <SearchTrigger />

      <NotificationBell />

      <UserMenu />
    </header>
  );
}
