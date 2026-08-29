"use client";

import type { ReactNode } from "react";
import { ShellProvider } from "./shell-context";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { BottomNav } from "./bottom-nav";
import { NavDrawer } from "./nav-drawer";
import { CommandPalette } from "./command-palette";

/**
 * Responsive application shell for the authenticated area.
 * Desktop: fixed sidebar + sticky topbar. Tablet/mobile: drawer + bottom nav.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ShellProvider>
      <a
        href="#main-content"
        className="focus:bg-primary focus:text-primary-foreground sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:px-3 focus:py-1.5 focus:text-sm focus:not-sr-only"
      >
        Skip to content
      </a>

      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main id="main-content" className="flex-1 pb-16 lg:pb-0">
            {children}
          </main>
        </div>
      </div>

      <BottomNav />
      <NavDrawer />
      <CommandPalette />
    </ShellProvider>
  );
}
