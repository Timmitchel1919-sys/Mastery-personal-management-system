"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAutonomy } from "@/features/autonomy";
import { useKnowledgeContext } from "@/features/context";
import { useDecisions } from "@/features/decisions";
import { useGoals } from "@/features/goals";
import { useIntelligence } from "@/features/intelligence";
import { listActivePlans } from "@/features/plans/repositories";
import type { Plan, PlanHorizon } from "@/features/plans/schema";
import { usePredictions } from "@/features/predictions";
import { useStrategy } from "@/features/strategy";
import { useTasks } from "@/features/tasks";
import { useDigitalTwin } from "@/features/twin";
import {
  buildAdaptationProposals,
  buildDailyBrief,
  buildFocusHealth,
  buildNotifications,
  buildPlanHealth,
  buildProjectHealth,
  buildSignals,
  buildSystemHealth,
  detectProposalConflicts,
  isProposalStale,
  prioritizeProposals,
  type AdaptationInput,
} from "./adaptation-model";

const HORIZONS: PlanHorizon[] = ["five-year", "one-year", "quarter", "month", "week"];
const REFRESH_MS = 180_000;

/**
 * Layer S — the Continuous Adaptation hook.
 *
 * The closed loop's OBSERVE/INTERPRET/EVALUATE step: it synthesises Strategy
 * (O), Predictions (J), the Digital Twin (Q), Knowledge context conflicts (P),
 * and Autonomy's pause state (R) into signals, health indicators, and
 * evidence-backed adaptation proposals. It issues one extra batched plan read;
 * everything else reuses hooks the rest of the app already calls. Nothing here
 * mutates data — approving a proposal is handled by the caller through Layer R.
 */
export function useAdaptation() {
  const goals = useGoals();
  const tasks = useTasks();
  const intelligence = useIntelligence();
  const predictions = usePredictions();
  const { decisions } = useDecisions();
  const strategy = useStrategy();
  const twin = useDigitalTwin();
  const context = useKnowledgeContext();
  const autonomy = useAutonomy();

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

  const input = useMemo<AdaptationInput>(
    () => ({
      nowIso,
      strategy: strategy.state,
      predictions: { status: predictions.status, enabled: predictions.enabled, signals: predictions.signals },
      twin: twin.baseline,
      calibration: twin.calibration,
      contextConflicts: context.conflicts,
      decisions,
      goals: goals.items,
      plans: plans ?? [],
      tasks: tasks.items,
      automationsPaused: autonomy.paused,
      intelligenceStatus: intelligence.status,
    }),
    [
      nowIso,
      strategy.state,
      predictions.status,
      predictions.enabled,
      predictions.signals,
      twin.baseline,
      twin.calibration,
      context.conflicts,
      decisions,
      goals.items,
      plans,
      tasks.items,
      autonomy.paused,
      intelligence.status,
    ],
  );

  const signals = useMemo(() => buildSignals(input), [input]);
  const signalsById = useMemo(() => new Map(signals.map((signal) => [signal.id, signal])), [signals]);
  const currentSignatures = useMemo(() => new Set(signals.map((signal) => `${signal.type}:${signal.statement}`)), [signals]);

  const proposalsRaw = useMemo(() => buildAdaptationProposals(signals, input.nowIso ?? nowIso), [signals, input.nowIso, nowIso]);
  const proposals = useMemo(
    () =>
      prioritizeProposals(proposalsRaw, signalsById).map((proposal) => ({
        ...proposal,
        status: isProposalStale(proposal, currentSignatures, nowIso) ? ("EXPIRED" as const) : proposal.status,
      })),
    [proposalsRaw, signalsById, currentSignatures, nowIso],
  );
  const activeProposals = useMemo(() => proposals.filter((p) => p.status === "PROPOSED"), [proposals]);
  const conflicts = useMemo(() => detectProposalConflicts(activeProposals), [activeProposals]);

  const planHealth = useMemo(() => buildPlanHealth(plans ?? [], goals.items, nowIso), [plans, goals.items, nowIso]);
  const projectHealth = useMemo(() => buildProjectHealth(tasks.items, nowIso), [tasks.items, nowIso]);
  const focusHealth = useMemo(() => buildFocusHealth(twin.baseline), [twin.baseline]);
  const systemHealth = useMemo(
    () =>
      buildSystemHealth({
        intelligenceStatus: intelligence.status,
        predictionsStatus: predictions.status,
        twinStatus: twin.status,
        automationsPaused: autonomy.paused,
      }),
    [intelligence.status, predictions.status, twin.status, autonomy.paused],
  );

  const notifications = useMemo(() => buildNotifications(signals, activeProposals, nowIso), [signals, activeProposals, nowIso]);
  const dailyBrief = useMemo(() => buildDailyBrief(signals, activeProposals, nowIso), [signals, activeProposals, nowIso]);

  const status = goals.status === "loading" && plans === null && tasks.status === "loading" ? "loading" : "ready";

  const reload = () => {
    goals.reload();
    tasks.reload();
    intelligence.reload();
    predictions.reload();
    strategy.reload();
    twin.reload();
    context.reload();
    void loadPlans();
  };

  return {
    status,
    signals,
    proposals,
    activeProposals,
    conflicts,
    goalHealth: strategy.state.goalHealth,
    planHealth,
    projectHealth,
    focusHealth,
    systemHealth,
    notifications,
    dailyBrief,
    strategy,
    twin,
    context,
    autonomy,
    reload,
  };
}
