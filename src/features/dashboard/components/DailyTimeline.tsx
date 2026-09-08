import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";

/**
 * Today's schedule as a vertical timeline. The Focus domain (time blocking,
 * Layer 9) feeds the entries; until a block exists this shows an intentional
 * empty state rather than a fabricated agenda.
 */
export function DailyTimeline() {
  return (
    <section aria-labelledby="timeline-heading" className="mastery-card p-5">
      <div className="flex items-center gap-2">
        <CalendarClock className="text-muted size-4" aria-hidden="true" />
        <h2 id="timeline-heading" className="text-sm font-semibold tracking-tight">
          Today&apos;s timeline
        </h2>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-muted text-sm leading-relaxed">
          Time blocks you schedule for today show up here in order, from first to last.
        </p>
        <Link
          href="/focus/time-blocking"
          className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Plan time blocks
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
