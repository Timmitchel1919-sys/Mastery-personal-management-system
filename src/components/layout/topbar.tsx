"use client";

import { Menu } from "lucide-react";
import { IconButton } from "@/components/ui";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { UserMenu } from "@/features/auth";
import { LiveClock } from "./live-clock";
import { SearchTrigger } from "./search-trigger";
import { useShell } from "./shell-context";

/**
 * Sticky top bar for the module panel: mobile nav toggle, live date/time, search,
 * a gold "Download app" action, notifications, and the account menu. It sits in the
 * content column beside the full-height sidebar, so it no longer needs a left offset.
 */
export function Topbar() {
  const { setDrawerOpen } = useShell();

  return (
    <header className="bg-surface-raised/95 border-border sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-3 backdrop-blur sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <IconButton
          aria-label="Open navigation"
          className="lg:hidden"
          icon={<Menu />}
          onClick={() => setDrawerOpen(true)}
        />
        <LiveClock />
      </div>

      <SearchTrigger />
      <InstallAppButton
        className="hidden md:inline-flex"
        size="sm"
        tone="gold"
        showFallbackText={false}
      />

      <UserMenu />
    </header>
  );
}
