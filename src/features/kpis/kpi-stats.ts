import { kpiAttainment } from "./schema";
import type { Kpi, KpiEntry } from "./schema";

export interface KpisStats {
  total: number;
  withEntries: number;
  avgAttainment: number | null;
}

/** The most recent entry in a list, by date. `null` for an empty list. Pure. */
export function latestEntry(entries: KpiEntry[]): KpiEntry | null {
  if (entries.length === 0) return null;
  return [...entries].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
}

/** Roll a set of KPIs + their entries into headline stats. Pure. */
export function summarizeKpis(kpis: Kpi[], entriesByKpi: Map<string, KpiEntry[]>): KpisStats {
  if (kpis.length === 0) {
    return { total: 0, withEntries: 0, avgAttainment: null };
  }

  let withEntries = 0;
  let attainmentSum = 0;
  let scored = 0;

  for (const kpi of kpis) {
    const entries = entriesByKpi.get(kpi.id) ?? [];
    if (entries.length > 0) withEntries += 1;

    const latest = latestEntry(entries);
    if (latest === null) continue;
    const attainment = kpiAttainment(kpi, latest.value);
    if (attainment === null) continue;
    attainmentSum += attainment;
    scored += 1;
  }

  return {
    total: kpis.length,
    withEntries,
    avgAttainment: scored === 0 ? null : Math.round(attainmentSum / scored),
  };
}
