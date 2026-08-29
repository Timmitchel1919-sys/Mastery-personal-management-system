"use client";

import Link from "next/link";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui";
import { SidebarNav } from "./sidebar-nav";
import { useShell } from "./shell-context";

/** Slide-in navigation drawer for mobile / tablet (< lg). */
export function NavDrawer() {
  const { drawerOpen, setDrawerOpen } = useShell();

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader>
          <SheetTitle asChild>
            <Link
              href="/dashboard"
              onClick={() => setDrawerOpen(false)}
              className="text-sm font-semibold tracking-tight"
            >
              Mastery
            </Link>
          </SheetTitle>
          <SheetDescription className="sr-only">Application navigation</SheetDescription>
        </SheetHeader>
        <SidebarNav onNavigate={() => setDrawerOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
