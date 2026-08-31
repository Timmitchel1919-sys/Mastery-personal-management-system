import { instantToWall, wallTimeToInstant } from "./zoned-time";
import type { CalendarEvent, Recurrence } from "./schema";

/**
 * Expands calendar events (recurring or not) into concrete occurrences that overlap a
 * given range. Pure. Recurrence stepping is done on the wall-clock date in the event's
 * own time zone, so "09:00 daily" stays at 09:00 across DST. Bounded by `MAX_OCCURRENCES`.
 */

export interface EventOccurrence {
  key: string;
  event: CalendarEvent;
  /** UTC instant. */
  start: Date;
  /** UTC instant, exclusive. */
  end: Date;
  allDay: boolean;
  recurring: boolean;
}

const DAY_MS = 86_400_000;
const MAX_OCCURRENCES = 400;
const MAX_STEPS = 5000;

interface DateParts {
  y: number;
  m: number; // 1-12
  d: number;
}

function parseDate(iso: string): DateParts {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return { y, m, d };
}

function partsToUtc({ y, m, d }: DateParts): number {
  return Date.UTC(y, m - 1, d);
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function addDaysParts(parts: DateParts, days: number): DateParts {
  const next = new Date(partsToUtc(parts) + days * DAY_MS);
  return { y: next.getUTCFullYear(), m: next.getUTCMonth() + 1, d: next.getUTCDate() };
}

function weekdayOf(parts: DateParts): number {
  return new Date(partsToUtc(parts)).getUTCDay(); // 0 = Sunday
}

function comparableKey({ y, m, d }: DateParts): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Ascending candidate start-dates for a recurrence, from `base` onward. Bounded generator. */
function* candidateDates(base: DateParts, recurrence: Recurrence): Generator<DateParts> {
  const { frequency, interval } = recurrence;

  if (frequency === "daily") {
    for (let step = 0; step < MAX_STEPS; step += 1) {
      yield addDaysParts(base, step * interval);
    }
    return;
  }

  if (frequency === "weekly") {
    const weekdays =
      recurrence.weekdays.length > 0
        ? [...recurrence.weekdays].sort((a, b) => a - b)
        : [weekdayOf(base)];
    const weekStart = addDaysParts(base, -weekdayOf(base)); // Sunday of the base week
    for (let block = 0; block < MAX_STEPS; block += 1) {
      const blockStart = addDaysParts(weekStart, block * interval * 7);
      for (const wd of weekdays) {
        const candidate = addDaysParts(blockStart, wd);
        if (partsToUtc(candidate) >= partsToUtc(base)) yield candidate;
      }
    }
    return;
  }

  if (frequency === "monthly") {
    for (let step = 0; step < MAX_STEPS; step += 1) {
      const totalMonths = base.m - 1 + step * interval;
      const y = base.y + Math.floor(totalMonths / 12);
      const m = (totalMonths % 12) + 1;
      if (base.d <= daysInMonth(y, m)) yield { y, m, d: base.d };
    }
    return;
  }

  // yearly
  for (let step = 0; step < MAX_STEPS; step += 1) {
    const y = base.y + step * interval;
    if (base.d <= daysInMonth(y, base.m)) yield { y, m: base.m, d: base.d };
  }
}

function baseWindow(event: CalendarEvent): { start: Date; end: Date } | null {
  if (event.allDay) {
    if (!event.startDate || !event.endDate) return null;
    const start = new Date(partsToUtc(parseDate(event.startDate)));
    const end = new Date(partsToUtc(parseDate(event.endDate)) + DAY_MS); // inclusive end date → exclusive
    return { start, end };
  }
  if (!event.startDateTime || !event.endDateTime) return null;
  return { start: new Date(event.startDateTime), end: new Date(event.endDateTime) };
}

function occurrenceAt(
  event: CalendarEvent,
  date: DateParts,
  durationMs: number,
): { start: Date; end: Date } {
  if (event.allDay) {
    const start = new Date(partsToUtc(date));
    return { start, end: new Date(start.getTime() + durationMs) };
  }
  const wallTime = instantToWall(new Date(event.startDateTime as string), event.timeZone).time;
  const start = wallTimeToInstant(`${comparableKey(date)}T${wallTime}`, event.timeZone);
  return { start, end: new Date(start.getTime() + durationMs) };
}

export function expandEvent(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date,
): EventOccurrence[] {
  const base = baseWindow(event);
  if (!base) return [];
  const durationMs = Math.max(0, base.end.getTime() - base.start.getTime());

  if (!event.recurrence) {
    if (base.start < rangeEnd && base.end > rangeStart) {
      return [
        {
          key: `${event.id}:${base.start.toISOString()}`,
          event,
          start: base.start,
          end: base.end,
          allDay: event.allDay,
          recurring: false,
        },
      ];
    }
    return [];
  }

  const recurrence = event.recurrence;
  const baseDateIso = event.allDay
    ? (event.startDate as string)
    : instantToWall(base.start, event.timeZone).date;
  const baseParts = parseDate(baseDateIso);
  const untilUtc = recurrence.until ? partsToUtc(parseDate(recurrence.until)) : null;

  const out: EventOccurrence[] = [];
  let produced = 0;

  for (const date of candidateDates(baseParts, recurrence)) {
    if (untilUtc !== null && partsToUtc(date) > untilUtc) break;
    produced += 1;
    if (recurrence.count !== null && produced > recurrence.count) break;

    const { start, end } = occurrenceAt(event, date, durationMs);
    if (start >= rangeEnd) {
      // Weekly can still yield earlier weekdays in the same block, so don't hard-break;
      // but once we are a full week past the range, further blocks only go later.
      if (start.getTime() - rangeEnd.getTime() > 7 * DAY_MS) break;
      continue;
    }
    if (end <= rangeStart) continue;

    out.push({
      key: `${event.id}:${start.toISOString()}`,
      event,
      start,
      end,
      allDay: event.allDay,
      recurring: true,
    });
    if (out.length >= MAX_OCCURRENCES) break;
  }

  return out;
}

export function expandEvents(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date,
): EventOccurrence[] {
  return events
    .flatMap((event) => expandEvent(event, rangeStart, rangeEnd))
    .sort(
      (a, b) => a.start.getTime() - b.start.getTime() || a.event.title.localeCompare(b.event.title),
    );
}
