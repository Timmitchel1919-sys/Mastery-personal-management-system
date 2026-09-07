"use client";

import Link from "next/link";
import Image from "next/image";
import { PanelLeftClose } from "lucide-react";
import { IconButton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import { useShell } from "./shell-context";

/** Fixed left sidebar for desktop (>= lg). Collapsible to an icon rail. */
export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, toggleSidebar } = useShell();

  return (
    <aside
      className={cn(
        "bg-surface-raised border-border sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 flex-col border-r lg:flex",
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
            sidebarCollapsed ? "justify-center" : "gap-2",
          )}
        >
          <Image
            src="/Mastery-logo-premium-4K-transparent.png"
            alt="Mastery logo"
            width={28}
            height={28}
            className="size-7 object-contain"
            priority
          />
          {!sidebarCollapsed ? <span className="text-sm font-semibold tracking-tight">Mastery</span> : null}
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
