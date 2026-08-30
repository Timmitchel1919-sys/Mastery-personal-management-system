"use client";

import {
  BarChart3,
  CalendarClock,
  Flame,
  Gauge,
  Milestone,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { ErrorState } from "@/components/shared";
import { Skeleton } from "@/components/ui";
import { useDashboard } from "../use-dashboard";
import { GreetingWidget } from "./GreetingWidget";
import { PlaceholderWidget } from "./PlaceholderWidget";
import { QuickNotesWidget } from "./QuickNotesWidget";
import { RecoveryShortcut } from "./RecoveryShortcut";
import { StatTile } from "./StatTile";

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

function LoadingGrid() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((key) => (
          <Skeleton key={key} className="h-44" />
        ))}
      </div>
    </div>
  );
}

export function DashboardView() {
  const { status, aggregate, error, reload, profile, user } = useDashboard();
  const identity = resolveIdentity(profile, user);

  return (
    <PageContainer size="wide" className="space-y-6">
      {status === "loading" && !aggregate ? (
        <LoadingGrid />
      ) : status === "error" || !aggregate ? (
        <ErrorState
          className="min-h-[50vh]"
          title="We couldn't load your dashboard"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : (
        <>
          <GreetingWidget
            displayName={identity.displayName}
            locale={identity.locale}
            timeZone={identity.timeZone}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile
              label="Focus today"
              value={aggregate.focusMinutesToday ?? "—"}
              hint={aggregate.focusMinutesToday === null ? "Focus tracking — Layer 9" : "minutes"}
              icon={<Timer className="size-4" />}
            />
            <StatTile
              label="Tasks completed"
              value={aggregate.tasksCompletedToday ?? "—"}
              hint={aggregate.tasksCompletedToday === null ? "Tasks — Layer 10" : "today"}
              icon={<Target className="size-4" />}
            />
            <StatTile
              label="Habits logged"
              value={
                aggregate.habitsLoggedToday
                  ? `${aggregate.habitsLoggedToday.done}/${aggregate.habitsLoggedToday.total}`
                  : "—"
              }
              hint={aggregate.habitsLoggedToday === null ? "Habits — Layer 10" : "today"}
              icon={<Flame className="size-4" />}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <QuickNotesWidget initialNotes={aggregate.quickNotes} />

            <PlaceholderWidget
              title="Today's priorities"
              icon={<CalendarClock className="size-4" />}
              message="Your weekly plan feeds today's priorities once planning is in place."
              href="/plan/weekly"
              linkLabel="Go to weekly plan"
              plannedLayer={8}
            />
            <PlaceholderWidget
              title="Goal progress"
              icon={<Target className="size-4" />}
              message="Progress across your goals will appear here."
              href="/plan/goals"
              linkLabel="Go to goals"
              plannedLayer={8}
            />
            <PlaceholderWidget
              title="Habit streaks"
              icon={<Flame className="size-4" />}
              message="Track streaks for spiritual disciplines, health, and routines."
              href="/act/habits"
              linkLabel="Go to habits"
              plannedLayer={10}
            />
            <PlaceholderWidget
              title="Upcoming milestones"
              icon={<Milestone className="size-4" />}
              message="Milestones due soon across your goals and projects."
              href="/plan/milestones"
              linkLabel="Go to milestones"
              plannedLayer={8}
            />
            <PlaceholderWidget
              title="Life Score"
              icon={<Gauge className="size-4" />}
              message="A transparent score built from your KPIs, with visible weighting."
              href="/analytics/life-score"
              linkLabel="Go to Life Score"
              plannedLayer={12}
            />
            <PlaceholderWidget
              title="KPI overview"
              icon={<BarChart3 className="size-4" />}
              message="Key measures across the spiritual, personal, and societal pillars."
              href="/analytics/kpis"
              linkLabel="Go to KPIs"
              plannedLayer={12}
            />
            <PlaceholderWidget
              title="AI Coach"
              icon={<Sparkles className="size-4" />}
              message="Ask for planning help grounded in your goals, tasks, and habits."
              href="/grow/ai-coach"
              linkLabel="Open AI Coach"
              plannedLayer={13}
            />
          </div>

          <div className="max-w-sm">
            <RecoveryShortcut />
          </div>
        </>
      )}
    </PageContainer>
  );
}
