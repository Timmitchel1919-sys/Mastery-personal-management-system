"use client";

import { Menu } from "lucide-react";
import { IconButton } from "@/components/ui";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { UserMenu } from "@/features/auth";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { cn } from "@/lib/utils";
import { BreadcrumbTrail } from "./breadcrumb-trail";
import { SearchTrigger } from "./search-trigger";
import { useShell } from "./shell-context";

/**
 * Sticky top bar: mobile nav toggle, breadcrumbs, search, notifications, account.
 * Theme is set from Settings, not from here (removed from the bar on request).
 */
export function Topbar() {
  const { setDrawerOpen, sidebarCollapsed } = useShell();

  return (
    <header
      className={cn(
        "bg-surface-raised border-border fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b px-3 sm:px-4",
        sidebarCollapsed ? "lg:pl-20" : "lg:pl-[17rem]",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
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
      </div>

      <SearchTrigger />
      <InstallAppButton className="hidden md:inline-flex" size="sm" showFallbackText={false} />

      <NotificationBell />

      <UserMenu />
    </header>
  );
}
