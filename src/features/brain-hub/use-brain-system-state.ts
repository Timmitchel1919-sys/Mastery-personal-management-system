"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listRecentDeepWork } from "@/features/deep-work/deep-work-repository";
import { summarizeDeepWork } from "@/features/deep-work/deep-work-stats";
import { listActiveGoals } from "@/features/goals/goal-repository";
import { listActiveKpis } from "@/features/kpis/kpi-repository";
import { listRecentKpiEntries } from "@/features/kpis/kpi-entry-repository";
import { summarizeKpis } from "@/features/kpis/kpi-stats";
import { listActiveLearningItems } from "@/features/learning/learning-item-repository";
import { listRecentJournalEntries } from "@/features/journal/journal-repository";
import { summarizeLearning } from "@/features/learning/learning-stats";
import { listActivePlans } from "@/features/plans/repositories";
import { listActiveTasks } from "@/features/tasks/task-repository";
import { summarizeTasks } from "@/features/tasks/task-stats";
import { listActiveTimeBlocks } from "@/features/time-blocking/time-block-repository";
import { summarizeTimeBlocks } from "@/features/time-blocking/time-block-stats";
import {
  buildBrainSystemState,
  makeNeutralBrainSystemState,
  type BrainModuleSignal,
  type BrainSystemState,
} from "./brain-state";
import type { BrainModuleId } from "./brain-modules";

const REFRESH_MS = 120_000;
const EVENT_PULSE_MS = 1800;

function maxUpdatedAt(values: Array<{ updatedAt: string }>): string | null {
  if (values.length === 0) return null;
  return [...values]
    .map((value) => value.updatedAt)
    .sort((a, b) => b.localeCompare(a))[0] ?? null;
}

function average(numbers: number[]): number | null {
  if (numbers.length === 0) return null;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function localToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function groupByKpi(entries: Awaited<ReturnType<typeof listRecentKpiEntries>>) {
  const grouped = new Map<string, typeof entries>();
  for (const entry of entries) {
    grouped.set(entry.kpiId, [...(grouped.get(entry.kpiId) ?? []), entry]);
  }
  return grouped;
}

async function fetchBrainModuleSignals(): Promise<Record<BrainModuleId, BrainModuleSignal>> {
  const [
    goals,
    weekPlans,
    monthPlans,
    deepWork,
    timeBlocks,
    tasks,
    journalEntries,
    learningItems,
    kpis,
    kpiEntries,
  ] = await Promise.all([
    listActiveGoals(),
    listActivePlans("week"),
    listActivePlans("month"),
    listRecentDeepWork(30),
    listActiveTimeBlocks(180),
    listActiveTasks(240),
    listRecentJournalEntries(120),
    listActiveLearningItems(100),
    listActiveKpis(100),
    listRecentKpiEntries(300),
  ]);

  const today = localToday();
  const goalAttention = goals.filter(
    (goal) =>
      goal.goalStatus === "on-hold" ||
      (goal.targetDate != null && goal.targetDate < today && goal.goalStatus !== "achieved"),
  ).length;

  const planItems = [...weekPlans, ...monthPlans];
  const deepWorkStats = summarizeDeepWork(deepWork);
  const timeBlockStats = summarizeTimeBlocks(timeBlocks);
  const taskStats = summarizeTasks(tasks);
  const learningStats = summarizeLearning(learningItems, []);
  const kpiStats = summarizeKpis(kpis, groupByKpi(kpiEntries));

  const focusCompleted = deepWorkStats.completed + timeBlockStats.done;
  const focusActive = Math.max(0, timeBlockStats.planned + deepWorkStats.sessions - deepWorkStats.completed);
  const focusProgressDenominator = focusCompleted + focusActive;
  const taskProgressDenominator = taskStats.open + taskStats.done;

  return {
    goals: {
      itemCount: goals.length,
      activeCount: goals.filter((goal) => goal.goalStatus === "in-progress").length,
      completedCount: goals.filter((goal) => goal.goalStatus === "achieved").length,
      attentionCount: goalAttention,
      progress: average(goals.map((goal) => goal.progress)),
      lastUpdatedAt: maxUpdatedAt(goals),
    },
    plan: {
      itemCount: planItems.length,
      activeCount: planItems.filter((plan) => plan.planStatus === "active").length,
      completedCount: planItems.filter((plan) => plan.planStatus === "complete").length,
      attentionCount: planItems.filter((plan) => plan.planStatus === "abandoned").length,
      progress: average(planItems.map((plan) => plan.progress)),
      lastUpdatedAt: maxUpdatedAt(planItems),
    },
    focus: {
      itemCount: deepWorkStats.sessions + timeBlockStats.blocks,
      activeCount: focusActive,
      completedCount: focusCompleted,
      attentionCount: timeBlockStats.conflictedBlocks,
      progress:
        focusProgressDenominator === 0 ? null : (focusCompleted / focusProgressDenominator) * 100,
      lastUpdatedAt: maxUpdatedAt([...deepWork, ...timeBlocks]),
    },
    act: {
      itemCount: taskStats.total,
      activeCount: taskStats.open,
      completedCount: taskStats.done,
      attentionCount: taskStats.overdue + taskStats.blocked,
      progress: taskProgressDenominator === 0 ? null : (taskStats.done / taskProgressDenominator) * 100,
      lastUpdatedAt: maxUpdatedAt(tasks),
    },
    grow: {
      itemCount: journalEntries.length + learningItems.length,
      activeCount: journalEntries.length + learningStats.inProgress,
      completedCount: learningStats.completed,
      attentionCount: learningItems.filter((item) => item.learningStatus === "paused").length,
      progress:
        learningItems.length === 0 ? null : (learningStats.completed / learningItems.length) * 100,
      lastUpdatedAt: maxUpdatedAt([...journalEntries, ...learningItems]),
    },
    analytics: {
      itemCount: kpis.length,
      activeCount: kpiStats.withEntries,
      completedCount: kpiStats.withEntries === kpis.length ? kpis.length : 0,
      attentionCount: Math.max(0, kpis.length - kpiStats.withEntries),
      progress: kpiStats.avgAttainment,
      lastUpdatedAt: maxUpdatedAt([...kpis, ...kpiEntries]),
    },
  };
}

function signature(signal: BrainModuleSignal): string {
  return [
    signal.itemCount,
    signal.activeCount,
    signal.completedCount,
    signal.attentionCount,
    signal.progress === null ? "na" : Math.round(signal.progress),
    signal.lastUpdatedAt ?? "none",
  ].join("|");
}

export function useBrainSystemState(): { state: BrainSystemState; reload: () => Promise<void> } {
  const [state, setState] = useState<BrainSystemState>(() => makeNeutralBrainSystemState("loading"));
  const signaturesRef = useRef<Partial<Record<BrainModuleId, string>>>({});
  const firstLoadRef = useRef(true);
  const eventTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const signals = await fetchBrainModuleSignals();
      const changed = (Object.keys(signals) as BrainModuleId[]).filter((id) => {
        const next = signature(signals[id]);
        const previous = signaturesRef.current[id];
        signaturesRef.current[id] = next;
        return previous != null && previous !== next;
      });

      const pulseMap = changed.reduce(
        (acc, id) => {
          acc[id] = !firstLoadRef.current;
          return acc;
        },
        {} as Partial<Record<BrainModuleId, boolean>>,
      );

      setState(buildBrainSystemState(signals, pulseMap));
      firstLoadRef.current = false;

      if (changed.length > 0 && !firstLoadRef.current) {
        if (eventTimeoutRef.current) clearTimeout(eventTimeoutRef.current);
        eventTimeoutRef.current = setTimeout(() => {
          setState((prev) => ({
            ...prev,
            modules: (Object.keys(prev.modules) as BrainModuleId[]).reduce(
              (acc, id) => {
                acc[id] = { ...prev.modules[id], recentEvent: false };
                return acc;
              },
              {} as BrainSystemState["modules"],
            ),
          }));
        }, EVENT_PULSE_MS);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "System status unavailable";
      setState(makeNeutralBrainSystemState("unavailable", message));
    }
  }, []);

  useEffect(() => {
    void load();

    const refresh = () => void load();
    const timer = setInterval(refresh, REFRESH_MS);
    window.addEventListener("focus", refresh);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (eventTimeoutRef.current) clearTimeout(eventTimeoutRef.current);
    };
  }, [load]);

  return useMemo(() => ({ state, reload: load }), [state, load]);
}
