import type { Habit } from "./schema";

/**
 * Pure schedule math for habits — "is this calendar day expected?" and "list expected days
 * in a range". Used by `habit-streak.ts` and the recent-days strip. Bounded to avoid
 * runaway loops on a long-lived habit (mirrors the calendar recurrence module's approach).
 */

const MAX_RANGE_DAYS = 400;

function toUtcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBetween(fromIso: string, toIsoDate: string): number {
  const ms = toUtcDate(toIsoDate).getTime() - toUtcDate(fromIso).getTime();
  return Math.round(ms / 86_400_000);
}

/** Whether `dateIso` is on/after `anchorIso` and matches the habit's frequency rule. */
export function isExpectedOn(
  habit: Pick<Habit, "frequency" | "interval" | "weekdays" | "daysOfMonth">,
  anchorIso: string,
  dateIso: string,
): boolean {
  const offset = daysBetween(anchorIso, dateIso);
  if (offset < 0) return false;

  if (habit.frequency === "daily") {
    return offset % Math.max(1, habit.interval) === 0;
  }
  if (habit.frequency === "weekly") {
    if (habit.weekdays.length === 0) return true;
    return habit.weekdays.includes(toUtcDate(dateIso).getUTCDay());
  }
  // monthly
  const days = habit.daysOfMonth.length > 0 ? habit.daysOfMonth : [1];
  return days.includes(toUtcDate(dateIso).getUTCDate());
}

/**
 * Every expected date in `[max(anchorIso, startIso), endIso]`, inclusive, chronological.
 * Bounded to `MAX_RANGE_DAYS` days of iteration.
 */
export function expectedDatesInRange(
  habit: Pick<Habit, "frequency" | "interval" | "weekdays" | "daysOfMonth">,
  anchorIso: string,
  startIso: string,
  endIso: string,
): string[] {
  const start =
    toUtcDate(anchorIso).getTime() > toUtcDate(startIso).getTime() ? anchorIso : startIso;
  if (toUtcDate(start).getTime() > toUtcDate(endIso).getTime()) return [];

  const dates: string[] = [];
  const cursor = toUtcDate(start);
  const end = toUtcDate(endIso);
  for (let step = 0; step <= MAX_RANGE_DAYS && cursor.getTime() <= end.getTime(); step += 1) {
    const iso = toIso(cursor);
    if (isExpectedOn(habit, anchorIso, iso)) dates.push(iso);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}
