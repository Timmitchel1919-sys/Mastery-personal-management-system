import Link from "next/link";
import { ArrowRight, Sunrise } from "lucide-react";

interface TodayFocusProps {
  /** Today's priorities from the Plan domain. Typed loosely until Layer 8 feeds
   * real records; today it is always empty and the panel shows its empty state. */
  priorities: unknown[];
}

/**
 * The primary anchor of the dashboard — visually dominant, gold-edged. Holds the
 * two or three things that make today a win. With no priorities set it shows an
 * intentional empty state that routes to the weekly plan, never filler tasks.
 */
export function TodayFocus({ priorities }: TodayFocusProps) {
  const count = priorities.length;

  return (
    <section
      aria-labelledby="today-focus-heading"
      className="mastery-focus-panel flex flex-col p-6 sm:p-7"
    >
      <div className="flex items-center gap-2">
        <Sunrise className="text-accent size-4" aria-hidden="true" />
        <h2 id="today-focus-heading" className="text-eyebrow">
          Today&apos;s Focus
        </h2>
      </div>

      {count > 0 ? (
        <p className="text-foreground mt-4 text-sm">
          {count} {count === 1 ? "priority" : "priorities"} set for today.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-foreground text-lg font-semibold tracking-tight">
            Nothing locked in yet.
          </p>
          <p className="text-muted max-w-md text-sm leading-relaxed">
            Pull today&apos;s priorities from your weekly plan. Two or three is usually
            enough — the things that, if done, make today count.
          </p>
          <Link
            href="/plan/weekly"
            className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            Open weekly plan
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}
