"use client";

import { PageContainer } from "@/components/layout";
import { ErrorState } from "@/components/shared";
import { Skeleton } from "@/components/ui";
import { IntelligencePanel } from "@/features/intelligence";
import { useDashboard } from "../use-dashboard";
import { DailyTimeline } from "./DailyTimeline";
import { DashboardHeader } from "./DashboardHeader";
import { ModuleGrid } from "./ModuleGrid";
import { PerformanceInsights } from "./PerformanceInsights";
import { QuickNotesWidget } from "./QuickNotesWidget";
import { RecoveryShortcut } from "./RecoveryShortcut";
import { TodayFocus } from "./TodayFocus";

function resolveIdentity(
  profile: ReturnType<typeof useDashboard>["profile"],
  user: ReturnType<typeof useDashboard>["user"],
) {
  const displayName =
    profile?.displayName?.trim() ||
    user?.displayName?.trim() ||
    user?.email?.split("@")[0] ||
    "there";
  const locale = profile?.language ?? "en";
  let timeZone = profile?.timezone ?? "UTC";
  try {
    if (!profile?.timezone) timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    timeZone = "UTC";
  }
  return { displayName, locale, timeZone };
}

function LoadingState() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((key) => (
          <Skeleton key={key} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * The Mastery dashboard — a personal operating system, not a widget wall.
 *
 * Composition: an executive header, the dominant Today's Focus anchor, the six
 * core modules arranged around the central "Your Mastery" mark, today's timeline,
 * and a compact performance read. Every surface has a real-data path and an
 * intentional empty state; no metric is fabricated. Data and business logic stay
 * in `useDashboard` / `loadDashboardAggregate` — this layer is composition only.
 */
export function DashboardView() {
  const { status, aggregate, error, reload, profile, user } = useDashboard();
  const identity = resolveIdentity(profile, user);

  return (
    <PageContainer size="wide" className="space-y-8">
      {status === "loading" && !aggregate ? (
        <LoadingState />
      ) : status === "error" || !aggregate ? (
        <ErrorState
          className="min-h-[50vh]"
          title="We couldn't load your dashboard"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : (
        <>
          <DashboardHeader
            displayName={identity.displayName}
            locale={identity.locale}
            timeZone={identity.timeZone}
            aggregate={aggregate}
          />

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr] lg:items-start">
            <TodayFocus priorities={aggregate.todaysPriorities} />
            <QuickNotesWidget initialNotes={aggregate.quickNotes} />
          </div>

          <ModuleGrid displayName={identity.displayName} />

          <DailyTimeline />

          <PerformanceInsights aggregate={aggregate} />

          <IntelligencePanel variant="compact" limit={2} />

          <div className="max-w-sm">
            <RecoveryShortcut />
          </div>
        </>
      )}
    </PageContainer>
  );
}
