import { describe, expect, it } from "vitest";
import { summarizeRoutines } from "./routine-stats";
import type { Routine, RoutineLog } from "./schema";

function makeRoutine(over: Partial<Routine> & Pick<Routine, "id">): Routine {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: "2026-09-02T08:00:00.000Z",
    updatedAt: "2026-09-02T08:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title: over.title ?? "Routine",
    description: "",
    routineType: over.routineType ?? "morning",
    pillarIds: [],
    isTemplate: over.isTemplate ?? false,
    steps: over.steps ?? [
      { id: "s1", title: "Step 1", estimatedMinutes: 10, habitId: null },
      { id: "s2", title: "Step 2", estimatedMinutes: 5, habitId: null },
    ],
  };
}

function makeLog(routineId: string, completedStepIds: string[]): RoutineLog {
  return {
    id: `${routineId}-log`,
    status: "active",
    version: 1,
    createdAt: "2026-09-02T08:00:00.000Z",
    updatedAt: "2026-09-02T08:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    routineId,
    date: "2026-09-02",
    completedStepIds,
    notes: "",
  };
}

describe("summarizeRoutines", () => {
  it("returns zeros for no routines", () => {
    expect(summarizeRoutines([], new Map())).toEqual({
      activeRoutines: 0,
      templates: 0,
      stepsCompletedToday: 0,
      stepsTotalToday: 0,
      minutesPlannedToday: 0,
    });
  });

  it("excludes templates from the active counts and totals today's progress", () => {
    const routine = makeRoutine({ id: "a" });
    const template = makeRoutine({ id: "b", isTemplate: true });
    const logs = new Map([["a", makeLog("a", ["s1"])]]);
    const stats = summarizeRoutines([routine, template], logs);
    expect(stats.activeRoutines).toBe(1);
    expect(stats.templates).toBe(1);
    expect(stats.stepsCompletedToday).toBe(1);
    expect(stats.stepsTotalToday).toBe(2);
    expect(stats.minutesPlannedToday).toBe(15);
  });
});
