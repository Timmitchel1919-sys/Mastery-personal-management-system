"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useBrainSystemState } from "@/features/brain-hub";
import { useDecisions } from "@/features/decisions";
import { useGoals } from "@/features/goals";
import { useIntelligence } from "@/features/intelligence";
import { listActivePlans } from "@/features/plans/repositories";
import type { Plan, PlanHorizon } from "@/features/plans/schema";
import { usePredictions } from "@/features/predictions";
import {
  analyzeWhatIf,
  buildStrategicReview,
  buildStrategy,
  type ReviewKind,
  type StrategicReview,
  type StrategyInput,
  type StrategyState,
  type WhatIfInput,
  type WhatIfResult,
} from "./strategy-engine";

const HORIZONS: PlanHorizon[] = ["five-year", "one-year", "quarter", "month", "week"];
const REFRESH_MS = 180_000;

/**
 * Layer O — the Strategy Engine hook.
 *
 * Composes existing derived-state hooks (goals, plans, intelligence, predictions,
 * decisions, brain-system-state) and folds them through the pure `buildStrategy`
 * reducer. It issues one batched plan read; everything else is already owned by
 * its source hook. A failing source degrades the analysis rather than breaking
 * it, and `review(kind)` is a pure projection of the current strategy state.
 */
export function useStrategy(): {
  status: "loading" | "ready";
  state: StrategyState;
  review: (kind: ReviewKind) => StrategicReview;
  whatIf: (question: WhatIfInput) => WhatIfResult;
  reload: () => void;
} {
  const goals = useGoals();
  const intelligence = useIntelligence();
  const predictions = usePredictions();
  const { state: brain, reload: reloadBrain } = useBrainSystemState();
  const { decisions } = useDecisions();

  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [nowIso] = useState(() => new Date().toISOString());

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

  const input = useMemo<StrategyInput>(
    () => ({
      nowIso,
      goals: goals.items,
      plans: plans ?? [],
      intelligence: {
        status: intelligence.status,
        attention: intelligence.attention,
        patterns: intelligence.patterns,
        recommendations: intelligence.recommendations,
        today: intelligence.today,
      },
      predictions: {
        status: predictions.status,
        enabled: predictions.enabled,
        signals: predictions.signals,
      },
      decisions,
      brain,
    }),
    [
      nowIso,
      goals.items,
      plans,
      intelligence.status,
      intelligence.attention,
      intelligence.patterns,
      intelligence.recommendations,
      intelligence.today,
      predictions.status,
      predictions.enabled,
      predictions.signals,
      decisions,
      brain,
    ],
  );

  const state = useMemo(() => buildStrategy(input), [input]);

  const review = useCallback((kind: ReviewKind) => buildStrategicReview(kind, input, state), [input, state]);

  const whatIf = useCallback((question: WhatIfInput) => analyzeWhatIf(input, question), [input]);

  const status =
    goals.status === "loading" && plans === null && brain.availability === "loading"
      ? "loading"
      : "ready";

  const reload = () => {
    goals.reload();
    intelligence.reload();
    predictions.reload();
    void reloadBrain();
    void loadPlans();
  };

  return { status, state, review, whatIf, reload };
}
