"use client";

import { Radar } from "lucide-react";
import { ErrorState } from "@/components/mastery";
import { Skeleton } from "@/components/ui";
import { usePredictions } from "../use-predictions";
import { PredictionCard } from "./PredictionCard";

interface PredictiveDashboardSectionProps {
  /** Total signals to show across all groups. */
  limit?: number;
  className?: string;
}

/**
 * The controlled predictive slice of the dashboard (STEP 20): a short, ranked
 * list grouped into "Watch" (risks) and "Opportunities". Self-gating on the
 * user's `predictiveInsights` switch, capped, and explicit about insufficient
 * data rather than guessing.
 */
export function PredictiveDashboardSection({
  limit = 3,
  className,
}: PredictiveDashboardSectionProps) {
  const { enabled, status, error, reload, signals, grouped, dismiss } = usePredictions();

  if (!enabled) return null;

  const shown = signals.slice(0, limit);
  const shownIds = new Set(shown.map((s) => s.id));
  const watch = grouped.watch.filter((s) => shownIds.has(s.id));
  const opportunities = grouped.opportunities.filter((s) => shownIds.has(s.id));

  return (
    <section aria-labelledby="predictions-heading" className={className}>
      <h2 id="predictions-heading" className="text-eyebrow mb-3 flex items-center gap-1.5">
        <Radar className="size-3.5" aria-hidden="true" />
        What may be ahead
      </h2>

      {status === "loading" ? (
        <Skeleton className="h-40" />
      ) : status === "error" ? (
        <ErrorState
          title="Predictions are temporarily unavailable"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : shown.length === 0 ? (
        <p className="text-muted border-border rounded-lg border border-dashed p-5 text-sm">
          Not enough historical data to make a reliable prediction yet. As your goals, schedule,
          and habits build up a record, Mastery will flag deadline risk, overloaded days, and
          stalling goals here.
        </p>
      ) : (
        <div className="space-y-5">
          {watch.length > 0 ? (
            <div className="space-y-3">
              <p className="text-subtle text-xs font-semibold tracking-[0.08em] uppercase">
                Watch
              </p>
              {watch.map((signal) => (
                <PredictionCard key={signal.id} signal={signal} onDismiss={dismiss} />
              ))}
            </div>
          ) : null}

          {opportunities.length > 0 ? (
            <div className="space-y-3">
              <p className="text-subtle text-xs font-semibold tracking-[0.08em] uppercase">
                Opportunities
              </p>
              {opportunities.map((signal) => (
                <PredictionCard key={signal.id} signal={signal} onDismiss={dismiss} />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
