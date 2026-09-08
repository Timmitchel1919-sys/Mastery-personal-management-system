"use client";

import Link from "next/link";
import { PanelLeftClose } from "lucide-react";
import { IconButton, Logo } from "@/components/ui";
import { useIsDesktop } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import { useShell } from "./shell-context";

/**
 * Left navigation panel. Full-height from the top of the screen.
 * - Desktop (>= lg): expanded module cards; user-collapsible to an icon rail.
 * - Tablet (md–lg): always the compact icon rail.
 * - Mobile (< md): hidden — the NavDrawer takes over.
 */
export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, toggleSidebar } = useShell();
  const isDesktop = useIsDesktop();
  const collapsed = !isDesktop || sidebarCollapsed;

  return (
    <aside
      className={cn(
        "bg-section border-border sticky top-0 z-20 hidden h-dvh shrink-0 flex-col border-r md:flex",
        collapsed ? "w-16" : "w-16 lg:w-64",
      )}
    >
      <div
        className={cn(
          "border-border flex h-14 items-center border-b px-3",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        <Link
          href="/dashboard"
          aria-label={collapsed ? "Mastery — open dashboard" : "Mastery dashboard"}
          onClick={() => setSidebarCollapsed(false)}
          className={cn(
            "inline-flex items-center rounded-md px-1 py-1 outline-none transition-opacity hover:opacity-90",
            "focus-visible:ring-ring focus-visible:ring-2",
          )}
        >
          {collapsed ? (
            <Logo variant="mark" height={22} withLabel={false} />
          ) : (
            <Logo variant="full" height={20} />
          )}
        </Link>

        {!collapsed ? (
          <IconButton
            size="sm"
            aria-label="Collapse sidebar"
            icon={<PanelLeftClose />}
            onClick={toggleSidebar}
            className="hidden lg:inline-flex"
          />
        ) : null}
      </div>
      <SidebarNav collapsed={collapsed} />
    </aside>
  );
}
