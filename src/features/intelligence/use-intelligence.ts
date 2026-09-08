"use client";

import { useMemo } from "react";
import { ANALYTICS_PERIODS, useAnalytics } from "@/features/analytics";
import { buildIntelligence, type MasteryInsight } from "./mastery-intelligence";

/**
 * Reactive Mastery Intelligence. Reuses `useAnalytics` (no extra data fetching)
 * and turns its real derivations into a prioritised, structured insight list.
 * All work is memoised — nothing recomputes on every render.
 */
export function useIntelligence() {
  const analytics = useAnalytics();

  const periodLabel =
    ANALYTICS_PERIODS.find((option) => option.value === analytics.period)?.label ?? "period";

  const insights: MasteryInsight[] = useMemo(
    () =>
      buildIntelligence({
        metrics: analytics.metrics,
        lifeScore: analytics.lifeScoreComparison,
        periodLabel: periodLabel.toLowerCase(),
        hasAnyData: analytics.hasAnyData,
      }),
    [analytics.metrics, analytics.lifeScoreComparison, periodLabel, analytics.hasAnyData],
  );

  return {
    status: analytics.status,
    error: analytics.error,
    reload: analytics.reload,
    hasAnyData: analytics.hasAnyData,
    insights,
  };
}
