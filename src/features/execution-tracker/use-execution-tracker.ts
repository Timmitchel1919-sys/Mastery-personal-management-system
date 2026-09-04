"use client";

import { useMemo, useState } from "react";
import { useDeepWork } from "@/features/deep-work";
import { useHabits } from "@/features/habits";
import { useRoutines } from "@/features/routines";
import { useTasks } from "@/features/tasks";
import {
  averageEnergyLevel,
  classifyTasks,
  periodRange,
  summarizeHabitsForPeriod,
  summarizeRoutinesForPeriod,
  type ExecutionPeriod,
  type ExecutionSummary,
} from "./execution-tracker";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface FocusEnergySummary {
  avgFocusQuality: number | null;
  avgEnergyLevel: number | null;
  focusMinutesLast7Days: number;
}

export function useExecutionTracker() {
  const [period, setPeriod] = useState<ExecutionPeriod>("week");
  const tasksHook = useTasks();
  const habitsHook = useHabits();
  const routinesHook = useRoutines();
  const deepWorkHook = useDeepWork();

  const statuses = [tasksHook.status, habitsHook.status, routinesHook.status, deepWorkHook.status];
  const status = statuses.includes("error")
    ? "error"
    : statuses.some((value) => value === "loading")
      ? "loading"
      : "ready";
  const error = tasksHook.error ?? habitsHook.error ?? routinesHook.error ?? deepWorkHook.error;

  const summary: ExecutionSummary = useMemo(() => {
    const range = periodRange(period, todayIso());
    return {
      period,
      range,
      tasks: classifyTasks(tasksHook.items, range, todayIso()),
      habits: summarizeHabitsForPeriod(habitsHook.habits, habitsHook.logsByHabit, range),
      routines: summarizeRoutinesForPeriod(routinesHook.routines, routinesHook.logs, range),
    };
  }, [
    period,
    tasksHook.items,
    habitsHook.habits,
    habitsHook.logsByHabit,
    routinesHook.routines,
    routinesHook.logs,
  ]);

  const focusEnergy: FocusEnergySummary = useMemo(
    () => ({
      avgFocusQuality: deepWorkHook.stats.avgFocusQuality,
      avgEnergyLevel: averageEnergyLevel(deepWorkHook.items),
      focusMinutesLast7Days: deepWorkHook.stats.last7DaysMinutes,
    }),
    [deepWorkHook.stats, deepWorkHook.items],
  );

  function reload() {
    tasksHook.reload();
    habitsHook.reload();
    routinesHook.reload();
    deepWorkHook.reload();
  }

  return { status, error, period, setPeriod, summary, focusEnergy, reload };
}
