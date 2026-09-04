import { computeRoutineProgress } from "./routine-progress";
import type { Routine, RoutineLog } from "./schema";

export interface RoutinesStats {
  activeRoutines: number;
  templates: number;
  stepsCompletedToday: number;
  stepsTotalToday: number;
  minutesPlannedToday: number;
}

/** Roll a set of routines + today's logs into headline counts. Pure. */
export function summarizeRoutines(
  routines: Routine[],
  logsByRoutine: Map<string, RoutineLog>,
): RoutinesStats {
  let activeRoutines = 0;
  let templates = 0;
  let stepsCompletedToday = 0;
  let stepsTotalToday = 0;
  let minutesPlannedToday = 0;

  for (const routine of routines) {
    if (routine.isTemplate) {
      templates += 1;
      continue;
    }
    activeRoutines += 1;
    const progress = computeRoutineProgress(routine, logsByRoutine.get(routine.id));
    stepsCompletedToday += progress.completedSteps;
    stepsTotalToday += progress.totalSteps;
    minutesPlannedToday += progress.totalMinutes;
  }

  return { activeRoutines, templates, stepsCompletedToday, stepsTotalToday, minutesPlannedToday };
}
