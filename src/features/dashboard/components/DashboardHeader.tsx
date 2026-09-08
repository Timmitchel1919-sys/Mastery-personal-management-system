"use client";

import { useMounted } from "@/hooks/use-mounted";
import {
  formatToday,
  greetingForHour,
  greetingText,
  type DashboardAggregate,
} from "../dashboard-aggregate";

interface DashboardHeaderProps {
  displayName: string;
  locale: string;
  timeZone: string;
  aggregate: DashboardAggregate;
}

/**
 * Executive header for the operating system: greeting + name, the standing
 * tagline, today's date, and a compact status line. Every value is real — a metric
 * the current data can't supply shows an em dash, never a fabricated number.
 */
export function DashboardHeader({
  displayName,
  locale,
  timeZone,
  aggregate,
}: DashboardHeaderProps) {
  // Time-of-day and the formatted date depend on the client's clock; render a
  // stable value until mounted to avoid a hydration mismatch.
  const mounted = useMounted();
  const now = mounted ? new Date() : null;

  const greeting = now ? greetingText(greetingForHour(now.getHours())) : "Welcome back";
  const dateLabel = now ? formatToday(now, locale, timeZone) : "";

  const priorityCount = aggregate.todaysPriorities.length;
  const focusMinutes = aggregate.focusMinutesToday;
  const goalProgress = aggregate.goalProgress;

  return (
    <header className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-eyebrow">{dateLabel || "Today"}</p>
        <h1 className="text-h1 text-foreground">
          {greeting}, {displayName}.
        </h1>
        <p className="text-muted text-sm">Discipline today. A greater tomorrow.</p>
      </div>

      <dl className="text-muted flex flex-wrap gap-x-8 gap-y-2 text-xs">
        <div className="flex items-center gap-1.5">
          <dt className="text-subtle tracking-wide uppercase">Priorities</dt>
          <dd className="text-foreground font-medium tabular-nums">
            {priorityCount > 0 ? priorityCount : "—"}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="text-subtle tracking-wide uppercase">Focus today</dt>
          <dd className="text-foreground font-medium tabular-nums">
            {focusMinutes === null ? "—" : `${focusMinutes} min`}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="text-subtle tracking-wide uppercase">Goal progress</dt>
          <dd className="text-foreground font-medium tabular-nums">
            {goalProgress === null ? "—" : `${Math.round(goalProgress * 100)}%`}
          </dd>
        </div>
      </dl>
    </header>
  );
}
