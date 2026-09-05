export interface TrendStats {
  min: number;
  max: number;
  avg: number;
  first: number;
  last: number;
  change: number;
}

/** Headline stats for a chronological series of numbers. `null` for an empty series. Pure. */
export function summarizeTrend(values: number[]): TrendStats | null {
  if (values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg =
    Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
  const first = values[0]!;
  const last = values[values.length - 1]!;

  return { min, max, avg, first, last, change: Math.round((last - first) * 100) / 100 };
}
