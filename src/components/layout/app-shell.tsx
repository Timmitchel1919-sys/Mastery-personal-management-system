"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { ShellProvider } from "./shell-context";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { BottomNav } from "./bottom-nav";
import { NavDrawer } from "./nav-drawer";
import { useShell } from "./shell-context";

// The command palette pulls in `cmdk`; it is never visible on first paint (opens
// on ⌘K / Ctrl-K, handled in ShellProvider). Split it out and mount it only once
// the user has actually opened it — see docs/PERFORMANCE.md §3.
const CommandPalette = dynamic(() => import("./command-palette").then((m) => m.CommandPalette), {
  ssr: false,
  loading: () => null,
});

function DeferredCommandPalette() {
  const { commandOpen } = useShell();
  const [everOpened, setEverOpened] = useState(false);
  // Latch on first open so the close animation and re-opens keep working without
  // re-fetching the chunk. Adjusting state during render is the supported pattern.
  if (commandOpen && !everOpened) setEverOpened(true);
  return everOpened ? <CommandPalette /> : null;
}

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
      <DeferredCommandPalette />
    </ShellProvider>
  );
}
