import type { EventOccurrence } from "./recurrence";

/**
 * Pure date-grid helpers for the calendar views. All functions treat a "day" by its local
 * calendar date; callers pass `Date` values whose local parts are the intended day.
 */

export type CalendarViewMode = "day" | "week" | "month";

const DAY_MS = 86_400_000;
/** Monday. `Date.getDay()` returns 0=Sun … 6=Sat. */
export const WEEK_STARTS_ON = 1;

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const diff = (day.getDay() - WEEK_STARTS_ON + 7) % 7;
  return addDays(day, -diff);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

/** 6 rows × 7 days covering the month that `anchor` falls in. */
export function monthMatrix(anchor: Date): Date[][] {
  const firstCell = startOfWeek(startOfMonth(anchor));
  const rows: Date[][] = [];
  for (let r = 0; r < 6; r += 1) {
    const row: Date[] = [];
    for (let c = 0; c < 7; c += 1) row.push(addDays(firstCell, r * 7 + c));
    rows.push(row);
  }
  return rows;
}

export function weekDates(anchor: Date): Date[] {
  const first = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

/** The [start, end) window a view covers, expanded to full weeks for the month grid. */
export function viewRange(view: CalendarViewMode, anchor: Date): { start: Date; end: Date } {
  if (view === "day") {
    const start = startOfDay(anchor);
    return { start, end: addDays(start, 1) };
  }
  if (view === "week") {
    const start = startOfWeek(anchor);
    return { start, end: addDays(start, 7) };
  }
  const start = startOfWeek(startOfMonth(anchor));
  return { start, end: addDays(start, 42) };
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function periodLabel(view: CalendarViewMode, anchor: Date): string {
  if (view === "day") {
    return `${MONTHS[anchor.getMonth()]} ${anchor.getDate()}, ${anchor.getFullYear()}`;
  }
  if (view === "week") {
    const days = weekDates(anchor);
    const first = days[0] as Date;
    const last = days[6] as Date;
    const firstLabel = `${MONTHS[first.getMonth()]?.slice(0, 3)} ${first.getDate()}`;
    const lastLabel =
      first.getMonth() === last.getMonth()
        ? `${last.getDate()}`
        : `${MONTHS[last.getMonth()]?.slice(0, 3)} ${last.getDate()}`;
    return `${firstLabel} – ${lastLabel}, ${last.getFullYear()}`;
  }
  return `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
}

export function navigate(view: CalendarViewMode, anchor: Date, direction: -1 | 1): Date {
  if (view === "day") return addDays(anchor, direction);
  if (view === "week") return addDays(anchor, direction * 7);
  return new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1);
}

/** Bucket occurrences by local day key. An occurrence spanning days lands in each. */
export function occurrencesByDay(
  occurrences: EventOccurrence[],
  days: Date[],
): Map<string, EventOccurrence[]> {
  const map = new Map<string, EventOccurrence[]>();
  for (const day of days) map.set(dayKey(day), []);

  for (const occ of occurrences) {
    for (const day of days) {
      const dayStart = startOfDay(day).getTime();
      const dayEnd = dayStart + DAY_MS;
      if (occ.start.getTime() < dayEnd && occ.end.getTime() > dayStart) {
        map.get(dayKey(day))?.push(occ);
      }
    }
  }
  return map;
}

export interface PositionedOccurrence {
  occ: EventOccurrence;
  /** Minutes from local midnight (clamped to the day). */
  topMinutes: number;
  /** Height in minutes (min 15 for visibility). */
  heightMinutes: number;
  column: number;
  columns: number;
}

/**
 * Assign side-by-side columns to timed occurrences on a single day so overlapping events
 * do not visually cover each other. Greedy interval-graph colouring.
 */
export function layoutDay(dayOccurrences: EventOccurrence[], day: Date): PositionedOccurrence[] {
  const dayStart = startOfDay(day).getTime();
  const timed = dayOccurrences
    .filter((occ) => !occ.allDay)
    .map((occ) => {
      const startMin = Math.max(0, Math.round((occ.start.getTime() - dayStart) / 60_000));
      const endMin = Math.min(
        24 * 60,
        Math.max(startMin + 15, Math.round((occ.end.getTime() - dayStart) / 60_000)),
      );
      return { occ, startMin, endMin };
    })
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const positioned: PositionedOccurrence[] = [];
  let cluster: typeof timed = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length === 0) return;
    const columnEnds: number[] = [];
    const assigned = cluster.map((item) => {
      let col = columnEnds.findIndex((end) => end <= item.startMin);
      if (col === -1) {
        col = columnEnds.length;
        columnEnds.push(item.endMin);
      } else {
        columnEnds[col] = item.endMin;
      }
      return { item, col };
    });
    const columns = columnEnds.length;
    for (const { item, col } of assigned) {
      positioned.push({
        occ: item.occ,
        topMinutes: item.startMin,
        heightMinutes: item.endMin - item.startMin,
        column: col,
        columns,
      });
    }
    cluster = [];
    clusterEnd = -1;
  };

  for (const item of timed) {
    if (cluster.length > 0 && item.startMin >= clusterEnd) flush();
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.endMin);
  }
  flush();

  return positioned;
}
