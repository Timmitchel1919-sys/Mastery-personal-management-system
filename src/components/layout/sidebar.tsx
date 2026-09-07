"use client";

import Link from "next/link";
import { PanelLeftClose } from "lucide-react";
import { IconButton, Logo } from "@/components/ui";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import { useShell } from "./shell-context";

/** Fixed left sidebar for desktop (>= lg). Collapsible to an icon rail. */
export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, toggleSidebar } = useShell();

  return (
    <aside
      className={cn(
        "bg-ivory border-border sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 flex-col border-r lg:flex",
        sidebarCollapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "border-border flex h-14 items-center border-b px-3",
          sidebarCollapsed ? "justify-center" : "justify-between",
        )}
      >
        <Link
          href="/dashboard"
          aria-label={sidebarCollapsed ? "Open sidebar" : "Mastery dashboard"}
          onClick={() => setSidebarCollapsed(false)}
          className={cn(
            "inline-flex items-center rounded-md px-1 py-1 outline-none transition-opacity hover:opacity-90",
            "focus-visible:ring-ring focus-visible:ring-2",
          )}
        >
          {sidebarCollapsed ? (
            <Logo variant="mark" height={22} withLabel={false} />
          ) : (
            <Logo variant="full" height={20} />
          )}
        </Link>

        {!sidebarCollapsed ? (
          <IconButton
            size="sm"
            aria-label="Collapse sidebar"
            icon={<PanelLeftClose />}
            onClick={toggleSidebar}
          />
        ) : null}
      </div>
      <SidebarNav collapsed={sidebarCollapsed} />
    </aside>
  );
}
