import type { Routine, RoutineLog } from "./schema";

export interface RoutineProgress {
  totalSteps: number;
  completedSteps: number;
  totalMinutes: number;
  completedMinutes: number;
}

/** Roll a routine's steps against one day's log into a completion summary. Pure. */
export function computeRoutineProgress(
  routine: Pick<Routine, "steps">,
  log: Pick<RoutineLog, "completedStepIds"> | undefined,
): RoutineProgress {
  const completedIds = new Set(log?.completedStepIds ?? []);
  let totalMinutes = 0;
  let completedMinutes = 0;
  let completedSteps = 0;

  for (const step of routine.steps) {
    totalMinutes += step.estimatedMinutes;
    if (completedIds.has(step.id)) {
      completedSteps += 1;
      completedMinutes += step.estimatedMinutes;
    }
  }

  return {
    totalSteps: routine.steps.length,
    completedSteps,
    totalMinutes,
    completedMinutes,
  };
}
