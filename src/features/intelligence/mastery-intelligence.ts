import {
  isImprovement,
  type MetricSummary,
  type PeriodComparison,
} from "@/features/analytics/analytics-insights";
import type { InsightSignal } from "@/components/mastery/AIInsightCard";

/**
 * "Mastery Intelligence" — deterministic, rule-based reads over the user's real
 * KPI and Life Score data. Not an LLM: no fabricated conclusions, no invented
 * confidence numbers. Each insight is split into FACT / INTERPRETATION /
 * RECOMMENDATION so the UI can keep those categories distinct, and carries a
 * qualitative signal strength derived from sample size.
 *
 * Pure module — no React, no I/O. Covered by mastery-intelligence.test.ts.
 */

export interface MasteryInsight {
  id: string;
  title: string;
  /** What the data shows — no interpretation. */
  fact: string;
  /** Why it might matter — hedged language, never asserted as certain. */
  interpretation: string;
  /** What the user could consider — never imperative. */
  recommendation: string;
  signal: InsightSignal;
  evidence: string[];
  /** A navigational CTA only, when a relevant screen exists. */
  action?: { label: string; href: string };
  kind: "attention" | "positive" | "neutral";
}

export interface IntelligenceInput {
  metrics: MetricSummary[];
  lifeScore: PeriodComparison;
  periodLabel: string;
  hasAnyData: boolean;
}

function strengthFor(sampleSize: number): InsightSignal {
  if (sampleSize >= 8) return "strong";
  if (sampleSize >= 4) return "moderate";
  return "limited";
}

const MEANINGFUL_PCT = 5;

function metricInsight(metric: MetricSummary, periodLabel: string): MasteryInsight | null {
  const { comparison } = metric;
  if (comparison.changePct === null || comparison.sampleSize < 3) return null;
  if (Math.abs(comparison.changePct) < MEANINGFUL_PCT) return null;

  const improving = isImprovement(metric);
  if (improving === null) return null;

  const dirWord = comparison.direction === "up" ? "rose" : "fell";
  const magnitude = `${Math.abs(comparison.changePct)}%`;
  const unit = metric.unit ? ` ${metric.unit}` : "";

  return {
    id: `metric-${metric.id}`,
    title: improving
      ? `${metric.label} is trending the right way`
      : `${metric.label} is slipping`,
    fact: `${metric.label} ${dirWord} ${magnitude} over the ${periodLabel} (${comparison.previous ?? "—"}${unit} → ${comparison.current ?? "—"}${unit}).`,
    interpretation: improving
      ? "Your data suggests whatever changed recently is working for this measure."
      : "This may indicate the routine behind this measure has weakened.",
    recommendation: improving
      ? "Consider keeping the current structure in place while it holds."
      : "Consider reviewing what changed and protecting time for it next period.",
    signal: strengthFor(comparison.sampleSize),
    evidence: [
      `${comparison.sampleSize} entries this period`,
      `Previous period value: ${comparison.previous ?? "not available"}${unit}`,
      `Current value: ${comparison.current ?? "not available"}${unit}`,
    ],
    action: { label: "Open KPIs", href: "/analytics/kpis" },
    kind: improving ? "positive" : "attention",
  };
}

function lifeScoreInsight(
  comparison: PeriodComparison,
  periodLabel: string,
): MasteryInsight | null {
  if (comparison.changeAbs === null || Math.abs(comparison.changeAbs) < 3) return null;
  const up = comparison.changeAbs > 0;

  return {
    id: "life-score",
    title: up ? "Life Score is rising" : "Life Score has dropped",
    fact: `Your Life Score moved ${comparison.changeAbs > 0 ? "+" : ""}${comparison.changeAbs} points over the ${periodLabel} (${comparison.previous ?? "—"} → ${comparison.current ?? "—"}).`,
    interpretation: up
      ? "Your data suggests the KPIs feeding the score are broadly improving."
      : "This may indicate one or more weighted KPIs have lost ground.",
    recommendation: up
      ? "Consider saving a Life Score entry to lock in the trend for comparison."
      : "Consider opening the Life Score breakdown to see which factors fell.",
    signal: strengthFor(comparison.sampleSize),
    evidence: [
      `${comparison.sampleSize} saved Life Scores this period`,
      `Previous: ${comparison.previous ?? "not available"}`,
      `Current: ${comparison.current ?? "not available"}`,
    ],
    action: { label: "Open Life Score", href: "/analytics/life-score" },
    kind: up ? "positive" : "attention",
  };
}

const KIND_ORDER: Record<MasteryInsight["kind"], number> = {
  attention: 0,
  positive: 1,
  neutral: 2,
};

/**
 * Build the prioritised insight list: attention items first, then positive, each
 * ordered by how large and well-sampled the movement is. Returns `[]` when there
 * is nothing real to say — the caller shows an "insufficient data" state rather
 * than a weak conclusion.
 */
export function buildIntelligence(input: IntelligenceInput): MasteryInsight[] {
  if (!input.hasAnyData) return [];

  const insights: MasteryInsight[] = [];
  for (const metric of input.metrics) {
    const insight = metricInsight(metric, input.periodLabel);
    if (insight) insights.push(insight);
  }
  const ls = lifeScoreInsight(input.lifeScore, input.periodLabel);
  if (ls) insights.push(ls);

  return insights.sort((a, b) => {
    const byKind = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    if (byKind !== 0) return byKind;
    const rank = { strong: 0, moderate: 1, limited: 2 } as const;
    return rank[a.signal] - rank[b.signal];
  });
}
