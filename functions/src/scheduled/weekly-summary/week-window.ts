export interface WeekRange {
  /** Inclusive, `YYYY-MM-DD`. */
  startIso: string;
  /** Exclusive, `YYYY-MM-DD`. */
  endIso: string;
}

/** The weekday abbreviation ("Mon", "Tue", …) for `now` in `timeZone`. Pure. */
export function localWeekday(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(now);
}

/** The local calendar date (`YYYY-MM-DD`) for `now` in `timeZone`. Pure. */
export function localDateKey(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}

/**
 * The 7 local calendar days before today: `[start, end)` where `end` is today's local
 * date. Calendar-day arithmetic (not exact instants) — good enough for bucketing which
 * week a record belongs to, not for billing-grade precision.
 */
export function pastWeekRange(now: Date, timeZone: string): WeekRange {
  const endIso = localDateKey(now, timeZone);
  const start = new Date(`${endIso}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 7);
  return { startIso: start.toISOString().slice(0, 10), endIso };
}

/** Whether a `YYYY-MM-DD` (or `null`) date key falls inside `[range.startIso, range.endIso)`. Pure. */
export function inRange(dateKey: string | null, range: WeekRange): boolean {
  return dateKey !== null && dateKey >= range.startIso && dateKey < range.endIso;
}
