"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { LoadingState } from "@/components/shared";
import { AppShell } from "@/components/layout";
import { useAuth } from "@/providers/auth-provider";

/**
 * Protected area. Client-side guard: loading state during session resolution,
 * redirect to `/login` when signed out, otherwise the responsive app shell.
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

  return <AppShell>{children}</AppShell>;
}
