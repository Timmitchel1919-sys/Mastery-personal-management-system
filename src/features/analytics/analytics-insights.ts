/**
 * Deterministic analytics helpers. Every value produced here is derived from real
 * user data (KPI entries and saved Life Scores) — no fabrication, no random data,
 * no hardcoded scores. When a series is too small to say anything, the helpers say
 * so ("No clear pattern yet." / empty signal lists).
 *
 * Pure module — no React, no I/O. Covered by analytics-insights.test.ts.
 */

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "all";

export const ANALYTICS_PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

/** Whole days in a period, or `null` for "all time". */
export function periodDays(period: AnalyticsPeriod): number | null {
  switch (period) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "all":
      return null;
  }
}

export interface DatedValue {
  /** ISO date (YYYY-MM-DD) or any Date-parseable string. */
  date: string;
  value: number;
}

export type TrendDirection = "up" | "down" | "flat";

export interface PeriodComparison {
  /** Latest value inside the current window. */
  current: number | null;
  /** Latest value inside the immediately-preceding window of equal length. */
  previous: number | null;
  changeAbs: number | null;
  changePct: number | null;
  direction: TrendDirection;
  /** Points that fell inside the current window — the comparison's sample size. */
  sampleSize: number;
}

const DAY_MS = 86_400_000;

function lastWithin(series: DatedValue[], from: number, to: number): DatedValue | null {
  let latest: DatedValue | null = null;
  let latestTime = -Infinity;
  for (const point of series) {
    const time = Date.parse(point.date);
    if (Number.isNaN(time) || time < from || time > to) continue;
    if (time >= latestTime) {
      latest = point;
      latestTime = time;
    }
  }
  return latest;
}

function countWithin(series: DatedValue[], from: number, to: number): number {
  let count = 0;
  for (const point of series) {
    const time = Date.parse(point.date);
    if (!Number.isNaN(time) && time >= from && time <= to) count += 1;
  }
  return count;
}

const round = (n: number, dp = 1) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

/**
 * Compare the latest value in the current period against the latest value in the
 * period immediately before it. For `"all"`, "previous" is the series' first value.
 */
export function comparePeriods(
  series: DatedValue[],
  period: AnalyticsPeriod,
  now: Date = new Date(),
): PeriodComparison {
  const empty: PeriodComparison = {
    current: null,
    previous: null,
    changeAbs: null,
    changePct: null,
    direction: "flat",
    sampleSize: 0,
  };
  if (series.length === 0) return empty;

  const nowTime = now.getTime();
  const days = periodDays(period);

  let current: DatedValue | null;
  let previous: DatedValue | null;
  let sampleSize: number;

  if (days === null) {
    const sorted = [...series]
      .filter((p) => !Number.isNaN(Date.parse(p.date)))
      .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    current = sorted.at(-1) ?? null;
    previous = sorted.length > 1 ? (sorted[0] ?? null) : null;
    sampleSize = sorted.length;
  } else {
    const windowMs = days * DAY_MS;
    current = lastWithin(series, nowTime - windowMs, nowTime);
    previous = lastWithin(series, nowTime - 2 * windowMs, nowTime - windowMs);
    sampleSize = countWithin(series, nowTime - windowMs, nowTime);
  }

  if (current === null) return { ...empty, sampleSize };
  if (previous === null) {
    return { current: current.value, previous: null, changeAbs: null, changePct: null, direction: "flat", sampleSize };
  }

  const changeAbs = round(current.value - previous.value, 2);
  const changePct = previous.value === 0 ? null : round((changeAbs / Math.abs(previous.value)) * 100);
  const direction: TrendDirection = changeAbs > 0 ? "up" : changeAbs < 0 ? "down" : "flat";

  return { current: current.value, previous: previous.value, changeAbs, changePct, direction, sampleSize };
}

export interface MetricSummary {
  id: string;
  label: string;
  unit: string;
  /** True when a rising value is the desired outcome. */
  higherIsBetter: boolean;
  comparison: PeriodComparison;
}

/** Whether a metric's movement this period is a good thing. `null` when flat / not meaningful. */
export function isImprovement(metric: MetricSummary): boolean | null {
  const { direction } = metric.comparison;
  if (direction === "flat" || metric.comparison.changeAbs === null) return null;
  return direction === "up" ? metric.higherIsBetter : !metric.higherIsBetter;
}

export interface KeyInsight {
  headline: string;
  detail: string | null;
  metricLabel: string | null;
  changePct: number | null;
  direction: TrendDirection;
  /** null when the movement has no positive/negative semantics. */
  positive: boolean | null;
}

const NO_PATTERN: KeyInsight = {
  headline: "No clear pattern yet.",
  detail: "Keep logging KPI entries and saving your Life Score — insights appear once there's enough history to compare.",
  metricLabel: null,
  changePct: null,
  direction: "flat",
  positive: null,
};

/**
 * The single most notable real movement across the given metrics: the largest
 * percentage change backed by at least `minSample` data points this period.
 * Returns "No clear pattern yet." when nothing qualifies.
 */
export function deriveKeyInsight(metrics: MetricSummary[], minSample = 3): KeyInsight {
  const ranked = metrics
    .filter((m) => m.comparison.changePct !== null && m.comparison.sampleSize >= minSample)
    .sort((a, b) => Math.abs(b.comparison.changePct ?? 0) - Math.abs(a.comparison.changePct ?? 0));

  const top = ranked[0];
  if (!top || top.comparison.changePct === null || Math.abs(top.comparison.changePct) < 1) {
    return NO_PATTERN;
  }

  const positive = isImprovement(top);
  const dirWord = top.comparison.direction === "up" ? "rose" : "fell";
  const magnitude = `${Math.abs(top.comparison.changePct)}%`;
  const sense =
    positive === null ? "changed" : positive ? "improved" : "slipped";

  return {
    headline: `Your ${top.label} ${sense} this period.`,
    detail: `${top.label} ${dirWord} ${magnitude} versus the previous period (${top.comparison.previous ?? "—"} → ${top.comparison.current ?? "—"}${top.unit ? ` ${top.unit}` : ""}).`,
    metricLabel: top.label,
    changePct: top.comparison.changePct,
    direction: top.comparison.direction,
    positive,
  };
}

export interface Signal {
  id: string;
  label: string;
  detail: string;
  /** An existing route to act on this signal, when one applies. */
  href?: string;
}

const MEANINGFUL_PCT = 5;

/** Metrics moving the wrong way (plus a Life Score drop), each with a real magnitude. */
export function deriveAttention(
  metrics: MetricSummary[],
  lifeScore: PeriodComparison | null,
): Signal[] {
  const signals: Signal[] = [];

  for (const metric of metrics) {
    const pct = metric.comparison.changePct;
    if (pct === null || metric.comparison.sampleSize < 3) continue;
    if (isImprovement(metric) === false && Math.abs(pct) >= MEANINGFUL_PCT) {
      signals.push({
        id: `kpi-${metric.id}`,
        label: `${metric.label} down ${Math.abs(pct)}%`,
        detail: `${metric.comparison.previous ?? "—"} → ${metric.comparison.current ?? "—"}${metric.unit ? ` ${metric.unit}` : ""} versus the previous period.`,
        href: "/analytics/kpis",
      });
    }
  }

  if (lifeScore && lifeScore.changeAbs !== null && lifeScore.changeAbs <= -3) {
    signals.push({
      id: "life-score",
      label: `Life Score down ${Math.abs(lifeScore.changeAbs)} points`,
      detail: `${lifeScore.previous ?? "—"} → ${lifeScore.current ?? "—"} versus the previous period.`,
      href: "/analytics/life-score",
    });
  }

  return signals;
}

/** Metrics moving the right way (plus a Life Score gain). */
export function derivePositive(
  metrics: MetricSummary[],
  lifeScore: PeriodComparison | null,
): Signal[] {
  const signals: Signal[] = [];

  for (const metric of metrics) {
    const pct = metric.comparison.changePct;
    if (pct === null || metric.comparison.sampleSize < 3) continue;
    if (isImprovement(metric) === true && Math.abs(pct) >= MEANINGFUL_PCT) {
      signals.push({
        id: `kpi-${metric.id}`,
        label: `${metric.label} up ${Math.abs(pct)}%`,
        detail: `${metric.comparison.previous ?? "—"} → ${metric.comparison.current ?? "—"}${metric.unit ? ` ${metric.unit}` : ""} versus the previous period.`,
        href: "/analytics/kpis",
      });
    }
  }

  if (lifeScore && lifeScore.changeAbs !== null && lifeScore.changeAbs >= 3) {
    signals.push({
      id: "life-score",
      label: `Life Score up ${lifeScore.changeAbs} points`,
      detail: `${lifeScore.previous ?? "—"} → ${lifeScore.current ?? "—"} versus the previous period.`,
      href: "/analytics/life-score",
    });
  }

  return signals;
}
