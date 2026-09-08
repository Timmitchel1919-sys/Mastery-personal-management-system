import Link from "next/link";
import { ArrowRight, Flame, Target, Timer, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/mastery";
import type { DashboardAggregate } from "../dashboard-aggregate";

/**
 * A compact read on trajectory. Shows only metrics the aggregate actually
 * supplies — focus time, task completion, habits, goal progress. A measure the
 * current data can't provide renders an em dash with a "Not tracked yet" hint;
 * nothing here is invented.
 */
export function PerformanceInsights({ aggregate }: { aggregate: DashboardAggregate }) {
  const { focusMinutesToday, tasksCompletedToday, habitsLoggedToday, goalProgress } = aggregate;

  return (
    <section aria-labelledby="insight-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="insight-heading" className="text-eyebrow">
          Performance
        </h2>
        <Link
          href="/analytics"
          className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
        >
          View analytics
          <ArrowRight className="size-3" aria-hidden="true" />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Focus today"
          value={focusMinutesToday ?? "—"}
          hint={focusMinutesToday === null ? "Not tracked yet" : "minutes"}
          icon={<Timer className="size-4" />}
        />
        <MetricCard
          label="Tasks done"
          value={tasksCompletedToday ?? "—"}
          hint={tasksCompletedToday === null ? "Not tracked yet" : "today"}
          icon={<Target className="size-4" />}
        />
        <MetricCard
          label="Habits"
          value={
            habitsLoggedToday
              ? `${habitsLoggedToday.done}/${habitsLoggedToday.total}`
              : "—"
          }
          hint={habitsLoggedToday === null ? "Not tracked yet" : "logged today"}
          icon={<Flame className="size-4" />}
        />
        <MetricCard
          label="Goal progress"
          value={goalProgress === null ? "—" : `${Math.round(goalProgress * 100)}%`}
          hint={goalProgress === null ? "Not tracked yet" : "across goals"}
          icon={<TrendingUp className="size-4" />}
        />
      </div>
    </section>
  );
}
