import { expectedDatesInRange, isExpectedOn } from "./habit-schedule";
import type { Habit, HabitLog } from "./schema";

/** Longest lookback window used to derive streaks — bounds the computation. */
const STREAK_LOOKBACK_DAYS = 365;

export interface HabitStreaks {
  currentStreak: number;
  longestStreak: number;
  /** Expected occurrences in the lookback window, for a completion-rate display. */
  expectedCount: number;
  completedCount: number;
}

export function anchorFor(habit: Pick<Habit, "createdAt">, today: string): string {
  const createdDate = habit.createdAt.slice(0, 10);
  const earliest = new Date(today);
  earliest.setUTCDate(earliest.getUTCDate() - STREAK_LOOKBACK_DAYS);
  const earliestIso = earliest.toISOString().slice(0, 10);
  return createdDate > earliestIso ? createdDate : earliestIso;
}

/**
 * Derive current + longest streak from a habit's schedule and its logs. **Computed, not
 * stored** (see `schema.ts`). A run is a sequence of *consecutive expected occurrences*
 * that are logged `completed` — gaps on non-expected days don't break it. Pure.
 */
export function computeHabitStreaks(
  habit: Pick<Habit, "createdAt" | "frequency" | "interval" | "weekdays" | "daysOfMonth">,
  logs: Pick<HabitLog, "date" | "logStatus">[],
  today: string,
): HabitStreaks {
  const anchor = anchorFor(habit, today);
  const expected = expectedDatesInRange(habit, anchor, anchor, today);
  const completedDates = new Set(
    logs.filter((log) => log.logStatus === "completed").map((log) => log.date),
  );

  let longestStreak = 0;
  let runLength = 0;
  let currentStreak = 0;

  for (const date of expected) {
    if (completedDates.has(date)) {
      runLength += 1;
      longestStreak = Math.max(longestStreak, runLength);
    } else {
      runLength = 0;
    }
  }
  // The current streak is the trailing run (the loop above already leaves `runLength` at
  // the trailing run's length once it finishes).
  currentStreak = runLength;

  return {
    currentStreak,
    longestStreak,
    expectedCount: expected.length,
    completedCount: expected.filter((date) => completedDates.has(date)).length,
  };
}

export type DayState = "completed" | "missed" | "not-expected";

/** The last `days` calendar days (oldest first) as a per-day dot state, for a habit strip. */
export function recentDayStates(
  habit: Pick<Habit, "createdAt" | "frequency" | "interval" | "weekdays" | "daysOfMonth">,
  logs: Pick<HabitLog, "date" | "logStatus">[],
  today: string,
  days = 7,
): { date: string; state: DayState }[] {
  const statusByDate = new Map(logs.map((log) => [log.date, log.logStatus]));
  const anchor = anchorFor(habit, today);
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const result: { date: string; state: DayState }[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < days; i += 1) {
    const iso = cursor.toISOString().slice(0, 10);
    if (!isExpectedOn(habit, anchor, iso) && !statusByDate.has(iso)) {
      result.push({ date: iso, state: "not-expected" });
    } else {
      const logged = statusByDate.get(iso);
      result.push({ date: iso, state: logged === "completed" ? "completed" : "missed" });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}
