"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { LoadingState } from "@/components/shared";
import { useAuth } from "@/providers/auth-provider";

/** Layout for unauthenticated pages. Sends already-signed-in users to the app. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status !== "unauthenticated") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <p className="text-muted text-xs font-medium tracking-[0.2em] uppercase">
        Plan · Focus · Act · Grow
      </p>
      {children}
    </main>
  );
}
