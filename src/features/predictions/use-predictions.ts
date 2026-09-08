"use client";

import { useMemo, useState } from "react";
import { useGoals } from "@/features/goals";
import { useHabits } from "@/features/habits";
import { useTasks } from "@/features/tasks";
import { useTimeBlocking } from "@/features/time-blocking";
import { usePersonalizationSettings } from "@/features/personalization/personalization-store";
import { buildPredictions, groupPredictions, type PredictiveSignal } from "./prediction-model";

type Status = "loading" | "ready" | "error";

/**
 * Composes the goal / task / time-block / habit hooks (their existing data — no
 * new fetching) into ranked predictive signals, then filters by the user's
 * prediction switches and their rejected-signal list. Everything is memoised;
 * nothing recomputes on every render.
 */
export function usePredictions() {
  const goals = useGoals();
  const tasks = useTasks();
  const blocks = useTimeBlocking();
  const habits = useHabits();
  const { settings, isRejected, rejectPattern, resetPersonalization } = usePersonalizationSettings();

  const [nowIso] = useState(() => new Date().toISOString());

  const status: Status = [goals, tasks, blocks, habits].some((h) => h.status === "error")
    ? "error"
    : [goals, tasks, blocks, habits].some((h) => h.status === "loading")
      ? "loading"
      : "ready";

  const error =
    goals.error ?? tasks.error ?? blocks.error ?? habits.error ?? null;

  const habitWindows = useMemo(
    () =>
      habits.habits.map((habit) => ({
        id: habit.id,
        title: habit.title,
        days: habits.recentDaysByHabit.get(habit.id) ?? [],
      })),
    [habits.habits, habits.recentDaysByHabit],
  );

  const allSignals: PredictiveSignal[] = useMemo(
    () =>
      buildPredictions({
        goals: goals.items,
        tasks: tasks.items,
        blocks: blocks.items,
        habitWindows,
        nowIso,
      }),
    [goals.items, tasks.items, blocks.items, habitWindows, nowIso],
  );

  const signals = useMemo(() => {
    if (!settings.predictiveInsights) return [];
    return allSignals.filter((signal) => {
      if (isRejected(signal.id)) return false;
      if (signal.category === "deadline-risk" && !settings.deadlineWarnings) return false;
      if (signal.category === "schedule-overload" && !settings.capacityWarnings) return false;
      if (signal.category === "goal-trajectory" && !settings.goalTrajectory) return false;
      return true;
    });
  }, [allSignals, settings, isRejected]);

  const grouped = useMemo(() => groupPredictions(signals), [signals]);

  const reload = () => {
    goals.reload();
    tasks.reload();
    blocks.reload();
    habits.reload();
  };

  return {
    status,
    error,
    reload,
    enabled: settings.predictiveInsights,
    signals,
    grouped,
    /** Unfiltered — for a settings inspector. */
    allSignals,
    dismiss: rejectPattern,
    resetPredictions: resetPersonalization,
  };
}
