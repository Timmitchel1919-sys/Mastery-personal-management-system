import { describe, expect, it } from "vitest";
import { computeRoutineProgress } from "./routine-progress";
import type { Routine, RoutineLog } from "./schema";

const routine: Pick<Routine, "steps"> = {
  steps: [
    { id: "s1", title: "Pray", estimatedMinutes: 10, habitId: null },
    { id: "s2", title: "Read", estimatedMinutes: 20, habitId: null },
    { id: "s3", title: "Exercise", estimatedMinutes: 30, habitId: null },
  ],
};

describe("computeRoutineProgress", () => {
  it("counts nothing done when there is no log for the day", () => {
    const progress = computeRoutineProgress(routine, undefined);
    expect(progress).toEqual({
      totalSteps: 3,
      completedSteps: 0,
      totalMinutes: 60,
      completedMinutes: 0,
    });
  });

  it("counts completed steps and their minutes from the log", () => {
    const log: Pick<RoutineLog, "completedStepIds"> = { completedStepIds: ["s1", "s3"] };
    const progress = computeRoutineProgress(routine, log);
    expect(progress).toEqual({
      totalSteps: 3,
      completedSteps: 2,
      totalMinutes: 60,
      completedMinutes: 40,
    });
  });

  it("ignores a completed id that no longer matches a step", () => {
    const log: Pick<RoutineLog, "completedStepIds"> = { completedStepIds: ["removed-step"] };
    const progress = computeRoutineProgress(routine, log);
    expect(progress.completedSteps).toBe(0);
  });
});
