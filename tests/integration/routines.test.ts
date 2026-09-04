import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { habitRepository } from "@/features/habits/habit-repository";
import {
  listRecentRoutineLogs,
  routineLogRepository,
} from "@/features/routines/routine-log-repository";
import { listActiveRoutines, routineRepository } from "@/features/routines/routine-repository";
import type { RoutineCreate } from "@/features/routines/schema";

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

function routineInput(over: Partial<RoutineCreate> = {}): RoutineCreate {
  return {
    title: "Morning routine",
    description: "",
    routineType: "morning",
    pillarIds: ["spiritual"],
    isTemplate: false,
    steps: [
      { id: "s1", title: "Pray", estimatedMinutes: 10, habitId: null },
      { id: "s2", title: "Stretch", estimatedMinutes: 5, habitId: null },
    ],
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

describe("routines repository", () => {
  it("creates a routine linked to a habit step, logs a day's completion, and archives it", async () => {
    const user = await signUpFresh("alice");

    const habit = await habitRepository.create({
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
      reminderTime: null,
      habitStatus: "active",
    });

    const routine = await routineRepository.create(
      routineInput({
        steps: [{ id: "s1", title: "Pray", estimatedMinutes: 10, habitId: habit.id }],
      }),
    );
    expect(routine.steps[0]?.habitId).toBe(habit.id);
    expect(routine.createdBy).toBe(user.uid);

    const today = routine.createdAt.slice(0, 10);
    const log = await routineLogRepository.create({
      routineId: routine.id,
      date: today,
      completedStepIds: ["s1"],
      notes: "",
    });
    expect(log.completedStepIds).toEqual(["s1"]);

    const logs = await listRecentRoutineLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.routineId).toBe(routine.id);

    // Templates round-trip too — duplicating is the hook's job, but the flag itself
    // must persist and be updatable.
    const template = await routineRepository.update(routine.id, { isTemplate: true });
    expect(template.isTemplate).toBe(true);
    expect(template.version).toBeGreaterThanOrEqual(2);

    await routineRepository.archive(routine.id);
    expect(await listActiveRoutines()).toHaveLength(0);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await routineRepository.create(routineInput({ title: "Private routine" }));
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listActiveRoutines()).toHaveLength(0);
    expect(await listRecentRoutineLogs()).toHaveLength(0);
  });
});
