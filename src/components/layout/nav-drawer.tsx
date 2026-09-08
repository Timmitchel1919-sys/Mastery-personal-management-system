"use client";

import Link from "next/link";
import {
  Logo,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui";
import { SidebarNav } from "./sidebar-nav";
import { useShell } from "./shell-context";

/**
 * Slide-in navigation drawer for mobile (< md). Renders the same expandable module
 * cards as the sidebar via `<SidebarNav />`. Radix Dialog handles focus trapping,
 * the overlay, and Escape-to-close; tapping any link closes it.
 */
export function NavDrawer() {
  const { drawerOpen, setDrawerOpen } = useShell();

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent side="left" className="bg-section w-76 p-0">
        <SheetHeader className="h-14 justify-center">
          <SheetTitle asChild>
            <Link
              href="/dashboard"
              onClick={() => setDrawerOpen(false)}
              className="inline-flex items-center outline-none"
              aria-label="Mastery dashboard"
            >
              <Logo variant="full" height={20} />
            </Link>
          </SheetTitle>
          <SheetDescription className="sr-only">Application navigation</SheetDescription>
        </SheetHeader>
        <SidebarNav onNavigate={() => setDrawerOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
