import { isExpectedOn } from "./habit-schedule";
import { anchorFor, computeHabitStreaks } from "./habit-streak";
import type { Habit, HabitLog } from "./schema";

export interface HabitsStats {
  activeHabits: number;
  pausedHabits: number;
  dueToday: number;
  completedToday: number;
  bestCurrentStreak: number;
}

/** Roll a set of habits + their logs into headline counts. Pure. */
export function summarizeHabits(habits: Habit[], logs: HabitLog[], today: string): HabitsStats {
  let activeHabits = 0;
  let pausedHabits = 0;
  let dueToday = 0;
  let completedToday = 0;
  let bestCurrentStreak = 0;

  const logsByHabit = new Map<string, HabitLog[]>();
  for (const log of logs) {
    logsByHabit.set(log.habitId, [...(logsByHabit.get(log.habitId) ?? []), log]);
  }

  for (const habit of habits) {
    if (habit.habitStatus === "paused") {
      pausedHabits += 1;
      continue;
    }
    activeHabits += 1;

    const habitLogs = logsByHabit.get(habit.id) ?? [];
    const anchor = anchorFor(habit, today);
    if (isExpectedOn(habit, anchor, today)) {
      dueToday += 1;
      if (habitLogs.some((log) => log.date === today && log.logStatus === "completed")) {
        completedToday += 1;
      }
    }

    const { currentStreak } = computeHabitStreaks(habit, habitLogs, today);
    bestCurrentStreak = Math.max(bestCurrentStreak, currentStreak);
  }

  return { activeHabits, pausedHabits, dueToday, completedToday, bestCurrentStreak };
}
