import type { ActionRecord } from "@/features/actions/action-model";
import type { MetricSummary, PeriodComparison } from "@/features/analytics/analytics-insights";

/**
 * Deterministic personalization signals over data the app has already loaded
 * (analytics comparisons + the Layer 10 action history). No ML, no inference of
 * anything personal — only "what does this user's recorded activity show, and is
 * there enough of it to say so?".
 *
 * Pure module — no React, no I/O. Covered by personal-signals.test.ts.
 */

export type DataSufficiency = "insufficient" | "limited" | "emerging" | "strong";

/**
 * Sufficiency bands for a behavioural sample. The thresholds are conservative and
 * chosen for interpretability rather than statistical power:
 *  - < 4  : too few points to distinguish signal from noise → "insufficient"
 *  - 4-11 : a hint, shown with a caveat → "limited"
 *  - 12-29: roughly a month of near-daily activity → "emerging"
 *  - 30+  : a sustained record → "strong"
 * They are qualitative labels, never presented as a confidence percentage.
 */
export const SUFFICIENCY_THRESHOLDS = { limited: 4, emerging: 12, strong: 30 } as const;

export function dataSufficiency(sampleSize: number): DataSufficiency {
  if (sampleSize >= SUFFICIENCY_THRESHOLDS.strong) return "strong";
  if (sampleSize >= SUFFICIENCY_THRESHOLDS.emerging) return "emerging";
  if (sampleSize >= SUFFICIENCY_THRESHOLDS.limited) return "limited";
  return "insufficient";
}

export const SUFFICIENCY_LABEL: Record<DataSufficiency, string> = {
  insufficient: "Not enough data",
  limited: "Limited data",
  emerging: "Emerging pattern",
  strong: "Strong historical pattern",
};

export type PersonalTrend = "improving" | "declining" | "stable" | "emerging" | "insufficient";

/**
 * Classify a period-over-period movement. Needs at least `limited` sufficiency to
 * say anything; between `limited` and `emerging` a real move is only ever called
 * "emerging", never "improving"/"declining". A move under 5% is "stable".
 */
export function classifyTrend(
  changePct: number | null,
  sampleSize: number,
): PersonalTrend {
  const sufficiency = dataSufficiency(sampleSize);
  if (sufficiency === "insufficient" || changePct === null) return "insufficient";
  if (Math.abs(changePct) < 5) return "stable";
  if (sufficiency === "limited") return "emerging";
  return changePct > 0 ? "improving" : "declining";
}

export interface AcceptanceSignal {
  applied: number;
  dismissed: number;
  total: number;
  /** 0..1, or null when there is nothing to divide. */
  rate: number | null;
  sufficiency: DataSufficiency;
}

/**
 * How often the user has acted on Mastery's suggested changes, from the Layer 10
 * action history. "cancelled" counts as dismissed; "failed" is excluded (it says
 * nothing about the user's preference). Only `source: "ai"` records count.
 */
export function acceptanceFromHistory(history: ActionRecord[]): AcceptanceSignal {
  const ai = history.filter((record) => record.source === "ai");
  const applied = ai.filter((record) => record.status === "completed").length;
  const dismissed = ai.filter((record) => record.status === "cancelled").length;
  const total = applied + dismissed;
  return {
    applied,
    dismissed,
    total,
    rate: total === 0 ? null : applied / total,
    sufficiency: dataSufficiency(total),
  };
}

export interface PersonalPattern {
  id: string;
  /** OBSERVED — the raw data, no interpretation. */
  observed: string;
  /** INTERPRETATION — hedged; "your data shows", never a diagnosis. */
  interpretation: string;
  /** RECOMMENDATION — "consider…", never imperative. */
  recommendation: string;
  sufficiency: DataSufficiency;
  /** Plain-language provenance for the inspector, e.g. "18 completed sessions". */
  source: string;
  trend?: PersonalTrend;
  action?: { label: string; href: string };
}

export interface SignalInputs {
  metrics: MetricSummary[];
  lifeScore: PeriodComparison;
  periodLabel: string;
  history: ActionRecord[];
}

/**
 * Build the personal-pattern list. Only patterns backed by at least `limited`
 * sufficiency are returned; the caller further filters by the user's settings
 * and rejected list.
 */
export function buildPersonalPatterns(inputs: SignalInputs): PersonalPattern[] {
  const patterns: PersonalPattern[] = [];

  // 1. Recommendation acceptance
  const acceptance = acceptanceFromHistory(inputs.history);
  if (acceptance.sufficiency !== "insufficient" && acceptance.rate !== null) {
    const pct = Math.round(acceptance.rate * 100);
    patterns.push({
      id: "acceptance-rate",
      observed: `You applied ${acceptance.applied} of the last ${acceptance.total} changes Mastery suggested.`,
      interpretation:
        pct >= 60
          ? "Your data shows suggested changes tend to be useful to you."
          : "Your data shows most suggested changes have not fit — Mastery can propose fewer.",
      recommendation:
        pct >= 60
          ? "Consider keeping suggestions on and reviewing them during planning."
          : "Consider turning off behaviour-based recommendations in Personalization settings.",
      sufficiency: acceptance.sufficiency,
      source: `${acceptance.total} reviewed suggestions`,
      action: { label: "Personalization settings", href: "/settings" },
    });
  }

  // 2. Strongest KPI trend
  const ranked = [...inputs.metrics]
    .filter((metric) => metric.comparison.changePct !== null && metric.comparison.sampleSize >= SUFFICIENCY_THRESHOLDS.limited)
    .sort(
      (a, b) => Math.abs(b.comparison.changePct ?? 0) - Math.abs(a.comparison.changePct ?? 0),
    );
  const top = ranked[0];
  if (top) {
    const trend = classifyTrend(top.comparison.changePct, top.comparison.sampleSize);
    if (trend === "improving" || trend === "declining" || trend === "emerging") {
      patterns.push({
        id: `metric-trend-${top.id}`,
        observed: `${top.label} moved ${top.comparison.changePct! > 0 ? "+" : ""}${top.comparison.changePct}% over the ${inputs.periodLabel} (${top.comparison.sampleSize} entries).`,
        interpretation:
          trend === "emerging"
            ? "Your data hints at a shift here, but there is not yet enough history to be sure."
            : `Your data shows a ${trend} run for this measure.`,
        recommendation:
          trend === "declining"
            ? "Consider reviewing what changed and protecting time for it next period."
            : "Consider keeping the current routine while it holds.",
        sufficiency: dataSufficiency(top.comparison.sampleSize),
        source: `${top.comparison.sampleSize} KPI entries`,
        trend,
        action: { label: "Open analytics", href: "/analytics" },
      });
    }
  }

  return patterns;
}

/**
 * A meaningful, non-speculative change worth surfacing — a large recent move with
 * enough history behind it. Returns `null` when nothing qualifies. Never states a
 * cause.
 */
export function detectSignificantChange(
  metrics: MetricSummary[],
  periodLabel: string,
): { observed: string; action: { label: string; href: string } } | null {
  const candidate = metrics
    .filter(
      (metric) =>
        metric.comparison.changePct !== null &&
        Math.abs(metric.comparison.changePct) >= 25 &&
        metric.comparison.sampleSize >= SUFFICIENCY_THRESHOLDS.emerging,
    )
    .sort(
      (a, b) => Math.abs(b.comparison.changePct ?? 0) - Math.abs(a.comparison.changePct ?? 0),
    )[0];

  if (!candidate) return null;
  const pct = candidate.comparison.changePct!;
  return {
    observed: `Your ${candidate.label} ${pct > 0 ? "rose" : "fell"} ${Math.abs(pct)}% over the ${periodLabel}.`,
    action: { label: "Review", href: "/analytics" },
  };
}
