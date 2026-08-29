"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { LoadingState } from "@/components/shared";
import { UserMenu } from "@/features/auth";
import { ThemeToggle } from "@/components/ui";
import { useAuth } from "@/providers/auth-provider";

/**
 * Protected shell for the authenticated app. Client-side guard: renders a loading
 * state during session resolution and redirects to `/login` when signed out.
 * The full responsive navigation shell (sidebar / bottom nav) replaces this header
 * in Layer 5.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?next=${next}`);
    }
  }, [status, pathname, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-border bg-background/80 sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 backdrop-blur">
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
          Mastery
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <UserMenu />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
