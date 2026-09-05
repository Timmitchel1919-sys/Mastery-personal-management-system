"use client";

import type { ReactNode } from "react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { ErrorState } from "@/components/shared";
import { Skeleton } from "@/components/ui";
import { useRecoveryLock } from "../use-recovery-lock";
import { PinEntryForm } from "./PinEntryForm";
import { PinSetupForm } from "./PinSetupForm";

/**
 * The Recovery Center's privacy gate (Layer 15A) — nothing behind it renders until the
 * user has set up and entered their PIN, per `docs/RECOVERY_PRIVACY.md` §1.
 */
export function RecoveryGate({ children }: { children: ReactNode }) {
  const { status, error, hasPin, unlocked, busy, pinError, setup, unlock, reset } =
    useRecoveryLock();

  if (status === "loading") {
    return (
      <PageContainer>
        <PageHeader
          title="Recovery Center"
          description="A separate, private module for self-identified behavioral patterns."
          breadcrumbs={<BreadcrumbTrail />}
        />
        <Skeleton className="mx-auto mt-6 h-72 max-w-sm" />
      </PageContainer>
    );
  }

  if (status === "error") {
    return (
      <PageContainer>
        <PageHeader title="Recovery Center" breadcrumbs={<BreadcrumbTrail />} />
        <ErrorState
          className="min-h-[40vh]"
          title="We couldn't open the Recovery Center"
          description={error ?? "Please try again."}
        />
      </PageContainer>
    );
  }

  if (unlocked) return <>{children}</>;

  return (
    <PageContainer>
      <PageHeader
        title="Recovery Center"
        description="A separate, private module for self-identified behavioral patterns."
        breadcrumbs={<BreadcrumbTrail />}
      />
      <div className="mt-6">
        {hasPin ? (
          <PinEntryForm busy={busy} error={pinError} onSubmit={unlock} onReset={reset} />
        ) : (
          <PinSetupForm busy={busy} error={pinError} onSubmit={setup} />
        )}
      </div>
    </PageContainer>
  );
}
