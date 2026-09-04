import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { goalRepository } from "@/features/goals/goal-repository";
import { habitLogRepository, listRecentHabitLogs } from "@/features/habits/habit-log-repository";
import { habitRepository, listActiveHabits } from "@/features/habits/habit-repository";
import { computeHabitStreaks } from "@/features/habits/habit-streak";
import type { HabitCreate } from "@/features/habits/schema";

const PROJECT_ID = "demo-mastery";
const AUTH_HOST = "http://127.0.0.1:9099";
const FIRESTORE_HOST = "http://127.0.0.1:8080";

async function resetEmulators() {
  await fetch(`${AUTH_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: "DELETE" });
  await fetch(
    `${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: "DELETE" },
  );
}

function uniqueEmail(tag: string) {
  return `${tag}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function signUpFresh(tag: string) {
  return authService.signUpWithEmail({
    email: uniqueEmail(tag),
    password: "sup3rsecret",
    displayName: tag,
  });
}

function habitInput(over: Partial<HabitCreate> = {}): HabitCreate {
  return {
    title: "Morning prayer",
    description: "",
    pillarIds: ["spiritual"],
    goalId: null,
    frequency: "daily",
    interval: 1,
    weekdays: [],
    daysOfMonth: [],
    target: 1,
    unit: "session",
    reminderTime: "06:30",
    habitStatus: "active",
    ...over,
  };
}

beforeEach(async () => {
  await resetEmulators();
  await authService.signOut().catch(() => {});
});

afterAll(async () => {
  await authService.signOut().catch(() => {});
});

describe("habits repository", () => {
  it("creates a habit linked to a goal, logs three days, and derives a streak", async () => {
    const user = await signUpFresh("alice");

    const goal = await goalRepository.create({
      title: "Ship v1",
      description: "",
      pillarIds: ["personal"],
      parentPlanId: null,
      startDate: null,
      targetDate: null,
      goalStatus: "in-progress",
      priority: "high",
      progress: 0,
      measurementType: "binary",
      targetValue: null,
      currentValue: null,
      unit: "",
      reviewFrequency: "none",
      notes: "",
    });

    const habit = await habitRepository.create(habitInput({ goalId: goal.id }));
    expect(habit.goalId).toBe(goal.id);
    expect(habit.createdBy).toBe(user.uid);

    const today = habit.createdAt.slice(0, 10);
    const day2 = new Date(`${today}T00:00:00Z`);
    day2.setUTCDate(day2.getUTCDate() + 1);
    const day2Iso = day2.toISOString().slice(0, 10);
    const day3 = new Date(day2);
    day3.setUTCDate(day3.getUTCDate() + 1);
    const day3Iso = day3.toISOString().slice(0, 10);

    await habitLogRepository.create({
      habitId: habit.id,
      date: today,
      logStatus: "completed",
      value: 0,
      notes: "",
    });
    await habitLogRepository.create({
      habitId: habit.id,
      date: day2Iso,
      logStatus: "completed",
      value: 0,
      notes: "",
    });
    const thirdLog = await habitLogRepository.create({
      habitId: habit.id,
      date: day3Iso,
      logStatus: "completed",
      value: 0,
      notes: "",
    });
    expect(thirdLog.createdBy).toBe(user.uid);

    const logs = await listRecentHabitLogs();
    expect(logs).toHaveLength(3);

    const streaks = computeHabitStreaks(habit, logs, day3Iso);
    expect(streaks.currentStreak).toBe(3);
    expect(streaks.longestStreak).toBe(3);

    // Correcting a day to "missed" is reflected immediately (upsert-by-date is the hook's
    // job; the repository itself just supports a normal update).
    const corrected = await habitLogRepository.update(thirdLog.id, { logStatus: "missed" });
    expect(corrected.logStatus).toBe("missed");
    const afterCorrection = computeHabitStreaks(habit, await listRecentHabitLogs(), day3Iso);
    expect(afterCorrection.currentStreak).toBe(0);
    expect(afterCorrection.longestStreak).toBe(2);

    await habitRepository.archive(habit.id);
    expect(await listActiveHabits()).toHaveLength(0);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await habitRepository.create(habitInput({ title: "Private habit" }));
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listActiveHabits()).toHaveLength(0);
    expect(await listRecentHabitLogs()).toHaveLength(0);
  });
});
