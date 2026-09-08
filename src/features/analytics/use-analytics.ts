"use client";

import { useMemo, useState } from "react";
import { useKpis } from "@/features/kpis";
import { useLifeScore } from "@/features/life-score";
import {
  comparePeriods,
  deriveAttention,
  deriveKeyInsight,
  derivePositive,
  type AnalyticsPeriod,
  type DatedValue,
  type MetricSummary,
} from "./analytics-insights";

type Status = "loading" | "ready" | "error";

/**
 * Composes the existing KPI and Life Score hooks (no new data fetching) and turns
 * them into period-aware, decision-oriented analytics. All derivation is memoized
 * and delegated to the pure `analytics-insights` module.
 */
export function useAnalytics() {
  const kpis = useKpis();
  const lifeScore = useLifeScore();
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  // Freeze "now" for the lifetime of the view so every comparison uses one clock.
  const [now] = useState(() => new Date());

  const status: Status =
    kpis.status === "error" || lifeScore.status === "error"
      ? "error"
      : kpis.status === "loading" || lifeScore.status === "loading"
        ? "loading"
        : "ready";

  const lifeScoreSeries: DatedValue[] = useMemo(
    () => lifeScore.history.map((entry) => ({ date: entry.date, value: entry.score })),
    [lifeScore.history],
  );

  const lifeScoreComparison = useMemo(
    () => comparePeriods(lifeScoreSeries, period, now),
    [lifeScoreSeries, period, now],
  );

  const metrics: MetricSummary[] = useMemo(
    () =>
      kpis.items.map((kpi) => {
        const series: DatedValue[] = (kpis.entriesByKpi.get(kpi.id) ?? []).map((entry) => ({
          date: entry.date,
          value: entry.value,
        }));
        return {
          id: kpi.id,
          label: kpi.title,
          unit: kpi.unit,
          higherIsBetter: kpi.direction === "higher-is-better",
          comparison: comparePeriods(series, period, now),
        };
      }),
    [kpis.items, kpis.entriesByKpi, period, now],
  );

  /** Metrics with a value this period, most-sampled first — the ones worth showing. */
  const rankedMetrics = useMemo(
    () =>
      [...metrics]
        .filter((metric) => metric.comparison.current !== null)
        .sort((a, b) => b.comparison.sampleSize - a.comparison.sampleSize),
    [metrics],
  );

  const insight = useMemo(() => deriveKeyInsight(metrics), [metrics]);
  const attention = useMemo(
    () => deriveAttention(metrics, lifeScoreComparison),
    [metrics, lifeScoreComparison],
  );
  const positive = useMemo(
    () => derivePositive(metrics, lifeScoreComparison),
    [metrics, lifeScoreComparison],
  );

  const hasAnyData = kpis.items.length > 0 || lifeScore.history.length > 0;

  return {
    status,
    error: kpis.error ?? lifeScore.error,
    reload: () => {
      kpis.reload();
      lifeScore.reload();
    },
    period,
    setPeriod,
    hasAnyData,
    kpis,
    lifeScore,
    lifeScoreSeries,
    lifeScoreComparison,
    metrics,
    rankedMetrics,
    insight,
    attention,
    positive,
  };
}
