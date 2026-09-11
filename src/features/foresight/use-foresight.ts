"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdaptation } from "@/features/adaptation";
import { useGoals } from "@/features/goals";
import { usePredictions } from "@/features/predictions";
import { useTasks } from "@/features/tasks";
import { useCalibration } from "./calibration-store";
import {
  buildEarlyWarnings,
  buildForecasts,
  buildFutureTimeline,
  refreshForecastStatus,
  type ActualEvent,
  type ForesightInput,
} from "./foresight-model";

/**
 * Layer U — the Predictive Personal Operating System hook.
 *
 * Reuses Layer S's already-composed synthesis (`useAdaptation`, which itself
 * composes Strategy/Twin/Context/Decisions/Autonomy) plus Layer J's raw
 * predictive signals, and folds them through the pure `buildForecasts`
 * pipeline. It adds one small extra read — goals and tasks with real dates —
 * to build the actual (confirmed) side of the future timeline; everything
 * else is already loaded elsewhere in the app.
 */
export function useForesight() {
  const adaptation = useAdaptation();
  const predictions = usePredictions();
  const goals = useGoals();
  const tasks = useTasks();
  const calibration = useCalibration();

  const [nowIso] = useState(() => new Date().toISOString());

  const input = useMemo<ForesightInput>(
    () => ({
      nowIso,
      predictions: { enabled: predictions.enabled, signals: predictions.signals },
      scenarios: adaptation.strategy.state.scenarios,
      goalHealth: adaptation.goalHealth,
      projectHealth: adaptation.projectHealth,
      planHealth: adaptation.planHealth,
      capacity: adaptation.twin.baseline.hasData ? adaptation.twin.baseline.capacity : null,
      calibration: adaptation.twin.calibration,
      hasData: adaptation.twin.baseline.hasData,
    }),
    [
      nowIso,
      predictions.enabled,
      predictions.signals,
      adaptation.strategy.state.scenarios,
      adaptation.goalHealth,
      adaptation.projectHealth,
      adaptation.planHealth,
      adaptation.twin.baseline,
      adaptation.twin.calibration,
    ],
  );

  const rawForecasts = useMemo(() => buildForecasts(input), [input]);
  const currentKeys = useMemo(() => new Set(rawForecasts.map((f) => `${f.type}::${f.statement}`)), [rawForecasts]);
  const forecasts = useMemo(
    () => refreshForecastStatus(rawForecasts, currentKeys, nowIso),
    [rawForecasts, currentKeys, nowIso],
  );
  const activeForecasts = useMemo(() => forecasts.filter((f) => f.status === "active"), [forecasts]);

  const warnings = useMemo(() => buildEarlyWarnings(forecasts), [forecasts]);

  const actualEvents = useMemo<ActualEvent[]>(() => {
    const events: ActualEvent[] = [];
    for (const goal of goals.items) {
      if (goal.targetDate) events.push({ id: `goal:${goal.id}`, label: `${goal.title} — target`, date: `${goal.targetDate}T00:00:00.000Z` });
    }
    for (const task of tasks.items) {
      if (task.taskStatus !== "done" && task.dueDate) {
        events.push({ id: `task:${task.id}`, label: `${task.title} — due`, date: `${task.dueDate}T00:00:00.000Z` });
      }
    }
    return events;
  }, [goals.items, tasks.items]);

  const timeline = useMemo(() => buildFutureTimeline(forecasts, actualEvents, nowIso), [forecasts, actualEvents, nowIso]);

  // Record every currently-active forecast in the calibration log so it can
  // later be confirmed against an outcome. Recording is idempotent per id;
  // deferred so this never triggers a synchronous setState-in-effect chain.
  useEffect(() => {
    const timer = setTimeout(() => {
      for (const forecast of activeForecasts) calibration.recordForecast(forecast);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeForecasts]);

  const status = adaptation.status === "loading" && goals.status === "loading" && tasks.status === "loading" ? "loading" : "ready";

  const reload = () => {
    adaptation.reload();
    predictions.reload();
    goals.reload();
    tasks.reload();
  };

  return {
    status,
    forecasts,
    activeForecasts,
    warnings,
    timeline,
    calibration,
    adaptation,
    reload,
  };
}
