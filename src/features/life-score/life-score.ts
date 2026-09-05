import { kpiAttainment } from "@/features/kpis";
import type { Kpi } from "@/features/kpis";
import type { LifeScoreFactor } from "./schema";

export interface LifeScoreResult {
  score: number | null;
  factors: LifeScoreFactor[];
}

/**
 * The Life Score formula (documented per spec — never an unexplained number):
 *
 * For every active KPI that has both a target and at least one entry, compute its
 * "attainment" (0-100, see `kpiAttainment`) from its most recent entry. The Life Score is
 * the weighted average of every scorable KPI's attainment, using each KPI's own
 * user-configurable `weight` (1-5) — a KPI the user cares about more can be given more
 * influence over the score.
 *
 * KPIs with no target or no entries yet are excluded entirely rather than counted as 0 —
 * missing data never drags the score down, it just means that KPI isn't part of it yet.
 * `score: null` means there is nothing scorable at all. The returned `factors` list is
 * exactly what contributed, so the UI can always show the user how the number was reached.
 */
export function computeLifeScore(
  kpis: Kpi[],
  latestValueByKpi: Map<string, number>,
): LifeScoreResult {
  const factors: LifeScoreFactor[] = [];

  for (const kpi of kpis) {
    const value = latestValueByKpi.get(kpi.id);
    if (value === undefined) continue;
    const attainment = kpiAttainment(kpi, value);
    if (attainment === null) continue;
    factors.push({ kpiId: kpi.id, title: kpi.title, value, attainment, weight: kpi.weight });
  }

  if (factors.length === 0) return { score: null, factors: [] };

  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
  const weighted = factors.reduce((sum, factor) => sum + factor.attainment * factor.weight, 0);
  return { score: Math.round(weighted / totalWeight), factors };
}
