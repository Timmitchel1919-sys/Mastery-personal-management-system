"use client";

import Link from "next/link";
import Image from "next/image";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { IconButton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import { useShell } from "./shell-context";

/** Fixed left sidebar for desktop (>= lg). Collapsible to an icon rail. */
export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useShell();

  return (
    <aside
      className={cn(
        "bg-background border-border sticky top-0 hidden h-dvh shrink-0 flex-col border-r lg:flex",
        sidebarCollapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "border-border flex h-14 items-center border-b px-3",
          sidebarCollapsed ? "justify-center" : "justify-between",
        )}
      >
        {!sidebarCollapsed ? (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-1 text-sm font-semibold tracking-tight"
          >
            <Image
              src="/brand/mastery-mark.png"
              alt=""
              width={512}
              height={199}
              className="h-5 w-auto shrink-0"
              priority
            />
            Mastery
          </Link>
        ) : null}
        <IconButton
          size="sm"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          icon={sidebarCollapsed ? <PanelLeft /> : <PanelLeftClose />}
          onClick={toggleSidebar}
        />
      </div>
      <SidebarNav collapsed={sidebarCollapsed} />
    </aside>
  );
}
