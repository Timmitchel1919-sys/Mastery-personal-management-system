import { describe, expect, it } from "vitest";
import { computeHabitStreaks, recentDayStates } from "./habit-streak";
import type { HabitLog } from "./schema";

const dailyHabit = {
  createdAt: "2026-09-01T08:00:00.000Z",
  frequency: "daily" as const,
  interval: 1,
  weekdays: [] as number[],
  daysOfMonth: [] as number[],
};

function log(date: string, logStatus: HabitLog["logStatus"]): Pick<HabitLog, "date" | "logStatus"> {
  return { date, logStatus };
}

describe("computeHabitStreaks", () => {
  it("counts a perfect run as both the current and longest streak", () => {
    const streaks = computeHabitStreaks(
      dailyHabit,
      [
        log("2026-09-01", "completed"),
        log("2026-09-02", "completed"),
        log("2026-09-03", "completed"),
      ],
      "2026-09-03",
    );
    expect(streaks.currentStreak).toBe(3);
    expect(streaks.longestStreak).toBe(3);
    expect(streaks.expectedCount).toBe(3);
    expect(streaks.completedCount).toBe(3);
  });

  it("a missed day resets the current streak but keeps the earlier longest", () => {
    const streaks = computeHabitStreaks(
      dailyHabit,
      [
        log("2026-09-01", "completed"),
        log("2026-09-02", "completed"),
        log("2026-09-03", "completed"),
        log("2026-09-04", "missed"),
        // 2026-09-05 has no log at all — also counts as not completed.
        log("2026-09-06", "completed"),
      ],
      "2026-09-06",
    );
    expect(streaks.longestStreak).toBe(3);
    expect(streaks.currentStreak).toBe(1);
  });

  it("is zero for a habit with no logs", () => {
    const streaks = computeHabitStreaks(dailyHabit, [], "2026-09-03");
    expect(streaks.currentStreak).toBe(0);
    expect(streaks.longestStreak).toBe(0);
  });

  it("only counts the habit's own expected weekdays toward the streak", () => {
    const weeklyHabit = {
      createdAt: "2026-08-31T00:00:00.000Z", // Monday
      frequency: "weekly" as const,
      interval: 1,
      weekdays: [1, 3], // Mon, Wed
      daysOfMonth: [] as number[],
    };
    const streaks = computeHabitStreaks(
      weeklyHabit,
      [log("2026-08-31", "completed"), log("2026-09-02", "completed")],
      "2026-09-02",
    );
    // Expected: Mon 08-31, Wed 09-02 — both completed.
    expect(streaks.expectedCount).toBe(2);
    expect(streaks.currentStreak).toBe(2);
  });
});

describe("recentDayStates", () => {
  it("marks expected-but-not-logged days as missed and off-schedule days as not-expected", () => {
    const weeklyHabit = {
      createdAt: "2026-08-31T00:00:00.000Z", // Monday
      frequency: "weekly" as const,
      interval: 1,
      weekdays: [1], // Monday only
      daysOfMonth: [] as number[],
    };
    const days = recentDayStates(weeklyHabit, [log("2026-08-31", "completed")], "2026-09-02", 3);
    expect(days.map((d) => d.date)).toEqual(["2026-08-31", "2026-09-01", "2026-09-02"]);
    expect(days.map((d) => d.state)).toEqual(["completed", "not-expected", "not-expected"]);
  });
});
