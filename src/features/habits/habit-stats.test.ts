import { describe, expect, it } from "vitest";
import { summarizeHabits } from "./habit-stats";
import type { Habit, HabitLog } from "./schema";

function makeHabit(over: Partial<Habit> & Pick<Habit, "id">): Habit {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: over.createdAt ?? "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title: over.title ?? "Habit",
    description: "",
    pillarIds: over.pillarIds ?? ["personal"],
    goalId: null,
    frequency: over.frequency ?? "daily",
    interval: over.interval ?? 1,
    weekdays: over.weekdays ?? [],
    daysOfMonth: over.daysOfMonth ?? [],
    target: 1,
    unit: "",
    reminderTime: null,
    habitStatus: over.habitStatus ?? "active",
  };
}

function makeLog(habitId: string, date: string, logStatus: HabitLog["logStatus"]): HabitLog {
  return {
    id: `${habitId}-${date}`,
    status: "active",
    version: 1,
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    habitId,
    date,
    logStatus,
    value: 0,
    notes: "",
  };
}

describe("summarizeHabits", () => {
  it("returns zeros for no habits", () => {
    expect(summarizeHabits([], [], "2026-09-03")).toEqual({
      activeHabits: 0,
      pausedHabits: 0,
      dueToday: 0,
      completedToday: 0,
      bestCurrentStreak: 0,
    });
  });

  it("separates active from paused, counts due/done today, and finds the best streak", () => {
    const daily = makeHabit({ id: "a" });
    const paused = makeHabit({ id: "b", habitStatus: "paused" });
    const stats = summarizeHabits(
      [daily, paused],
      [
        makeLog("a", "2026-09-01", "completed"),
        makeLog("a", "2026-09-02", "completed"),
        makeLog("a", "2026-09-03", "completed"),
      ],
      "2026-09-03",
    );
    expect(stats.activeHabits).toBe(1);
    expect(stats.pausedHabits).toBe(1);
    expect(stats.dueToday).toBe(1);
    expect(stats.completedToday).toBe(1);
    expect(stats.bestCurrentStreak).toBe(3);
  });

  it("does not count a habit as due today when today isn't an expected day", () => {
    const weeklyMonday = makeHabit({
      id: "c",
      createdAt: "2026-08-31T00:00:00.000Z",
      frequency: "weekly",
      weekdays: [1],
    });
    // 2026-09-02 is a Wednesday, not Monday.
    const stats = summarizeHabits([weeklyMonday], [], "2026-09-02");
    expect(stats.dueToday).toBe(0);
  });
});
