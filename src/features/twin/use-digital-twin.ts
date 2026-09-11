"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDecisions } from "@/features/decisions";
import { useGoals } from "@/features/goals";
import { listActivePlans } from "@/features/plans/repositories";
import type { Plan, PlanHorizon } from "@/features/plans/schema";
import { usePredictions } from "@/features/predictions";
import { useTasks } from "@/features/tasks";
import {
  buildApplyPreview,
  buildBaseline,
  calibrateFromHistory,
  compareScenarios,
  runSimulation,
  type ApplyPreview,
  type ComparisonRow,
  type DigitalTwinState,
  type HistoricalCalibration,
  type Scenario,
  type SimulationResult,
  type TwinInput,
} from "./digital-twin";
import { useScenarioLibrary } from "./scenario-store";

const HORIZONS: PlanHorizon[] = ["five-year", "one-year", "quarter", "month", "week"];
const REFRESH_MS = 180_000;

/**
 * Layer Q — the Digital Twin hook.
 *
 * Composes the domain hooks the signed-in user already loads into a baseline
 * operational state, and exposes deterministic, memoised simulation + comparison.
 * Nothing here mutates real data; `applyPreview` only describes what applying a
 * scenario would do.
 */
export function useDigitalTwin(availableFocusHoursPerWeek?: number): {
  status: "loading" | "ready";
  baseline: DigitalTwinState;
  calibration: HistoricalCalibration;
  library: ReturnType<typeof useScenarioLibrary>;
  simulate: (scenario: Scenario) => SimulationResult;
  compare: (scenarioIds: string[]) => ComparisonRow[];
  applyPreview: (scenario: Scenario) => ApplyPreview;
  reload: () => void;
} {
  const goals = useGoals();
  const tasks = useTasks();
  const predictions = usePredictions();
  const { decisions } = useDecisions();
  const library = useScenarioLibrary();

  const [plans, setPlans] = useState<Plan[] | null>(null);

  const loadPlans = useCallback(async () => {
    try {
      const pages = await Promise.all(HORIZONS.map((horizon) => listActivePlans(horizon)));
      setPlans(pages.flat());
    } catch {
      setPlans([]);
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => void loadPlans(), 0);
    const timer = setInterval(() => void loadPlans(), REFRESH_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [loadPlans]);

  const input = useMemo<TwinInput>(
    () => ({
      goals: goals.items,
      plans: plans ?? [],
      tasks: tasks.items,
      predictions: {
        enabled: predictions.enabled,
        status: predictions.status,
        signals: predictions.signals,
      },
      decisions,
      ...(availableFocusHoursPerWeek !== undefined
        ? { availableFocusHoursPerWeek }
        : {}),
    }),
    [
      goals.items,
      plans,
      tasks.items,
      predictions.enabled,
      predictions.status,
      predictions.signals,
      decisions,
      availableFocusHoursPerWeek,
    ],
  );

  const baseline = useMemo(() => buildBaseline(input), [input]);
  const calibration = useMemo(() => calibrateFromHistory(tasks.items), [tasks.items]);

  const simulate = useCallback(
    (scenario: Scenario) => runSimulation(baseline, scenario, calibration),
    [baseline, calibration],
  );

  const compare = useCallback(
    (scenarioIds: string[]) => {
      const results = scenarioIds
        .map((id) => library.scenarios.find((scenario) => scenario.id === id))
        .filter((scenario): scenario is Scenario => Boolean(scenario))
        .map((scenario) => runSimulation(baseline, scenario, calibration));
      return compareScenarios(results);
    },
    [library.scenarios, baseline, calibration],
  );

  const applyPreview = useCallback((scenario: Scenario) => buildApplyPreview(scenario), []);

  const status =
    goals.status === "loading" && plans === null && tasks.status === "loading" ? "loading" : "ready";

  const reload = () => {
    goals.reload();
    tasks.reload();
    predictions.reload();
    void loadPlans();
  };

  return { status, baseline, calibration, library, simulate, compare, applyPreview, reload };
}
