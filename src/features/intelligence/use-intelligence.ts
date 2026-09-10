"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ANALYTICS_PERIODS, useAnalytics } from "@/features/analytics";
import type { BrainModuleId } from "@/features/brain-hub";
import { listRecentDeepWork } from "@/features/deep-work/deep-work-repository";
import { listActiveGoals } from "@/features/goals/goal-repository";
import { listRecentJournalEntries } from "@/features/journal/journal-repository";
import { listActiveLearningItems } from "@/features/learning/learning-item-repository";
import { listActivePlans } from "@/features/plans/repositories";
import { listActiveTasks } from "@/features/tasks/task-repository";
import { buildIntelligence, type IntelligenceOutput } from "./mastery-intelligence";

type DataStatus = "loading" | "ready" | "error";

interface IntelligenceDataSnapshot {
  goals: Awaited<ReturnType<typeof listActiveGoals>>;
  plans: Awaited<ReturnType<typeof listActivePlans>>;
  tasks: Awaited<ReturnType<typeof listActiveTasks>>;
  deepWorkSessions: Awaited<ReturnType<typeof listRecentDeepWork>>;
  journalEntries: Awaited<ReturnType<typeof listRecentJournalEntries>>;
  learningItems: Awaited<ReturnType<typeof listActiveLearningItems>>;
}

const REFRESH_MS = 120_000;

async function loadSnapshot(): Promise<IntelligenceDataSnapshot> {
  const [goals, weekPlans, monthPlans, tasks, deepWorkSessions, journalEntries, learningItems] =
    await Promise.all([
      listActiveGoals(),
      listActivePlans("week"),
      listActivePlans("month"),
      listActiveTasks(240),
      listRecentDeepWork(40),
      listRecentJournalEntries(120),
      listActiveLearningItems(100),
    ]);

  return {
    goals,
    plans: [...weekPlans, ...monthPlans],
    tasks,
    deepWorkSessions,
    journalEntries,
    learningItems,
  };
}

export interface UseIntelligenceOptions {
  moduleId?: BrainModuleId;
}

/**
 * Advanced deterministic intelligence hook.
 * Facts come from repositories + analytics; interpretation/recommendation come from
 * deterministic rules — no fabricated insights, and no LLM dependency.
 */
export function useIntelligence(options?: UseIntelligenceOptions) {
  const analytics = useAnalytics();
  const [snapshotStatus, setSnapshotStatus] = useState<DataStatus>("loading");
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<IntelligenceDataSnapshot | null>(null);

  const load = useCallback(async () => {
    setSnapshotStatus("loading");
    setSnapshotError(null);
    try {
      const next = await loadSnapshot();
      setSnapshot(next);
      setSnapshotStatus("ready");
    } catch (error) {
      setSnapshotStatus("error");
      setSnapshotError(error instanceof Error ? error.message : "Unable to load intelligence data");
    }
  }, []);

  useEffect(() => {
    const initialTimer = setTimeout(() => void load(), 0);
    const timer = setInterval(() => void load(), REFRESH_MS);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const periodLabel =
    ANALYTICS_PERIODS.find((option) => option.value === analytics.period)?.label.toLowerCase() ?? "period";

  const output: IntelligenceOutput = useMemo(() => {
    if (!snapshot) {
      return buildIntelligence({
        metrics: [],
        lifeScore: {
          current: null,
          previous: null,
          changeAbs: null,
          changePct: null,
          direction: "flat",
          sampleSize: 0,
        },
        periodLabel,
        hasAnyData: false,
        goals: [],
        plans: [],
        tasks: [],
        deepWorkSessions: [],
        journalEntries: [],
        learningItems: [],
      });
    }

    return buildIntelligence({
      metrics: analytics.metrics,
      lifeScore: analytics.lifeScoreComparison,
      periodLabel,
      hasAnyData:
        analytics.hasAnyData ||
        snapshot.goals.length > 0 ||
        snapshot.tasks.length > 0 ||
        snapshot.deepWorkSessions.length > 0 ||
        snapshot.learningItems.length > 0 ||
        snapshot.journalEntries.length > 0,
      ...snapshot,
    });
  }, [snapshot, analytics.metrics, analytics.lifeScoreComparison, analytics.hasAnyData, periodLabel]);

  const rawHasData =
    analytics.hasAnyData ||
    !!snapshot &&
      (snapshot.goals.length > 0 ||
        snapshot.plans.length > 0 ||
        snapshot.tasks.length > 0 ||
        snapshot.deepWorkSessions.length > 0 ||
        snapshot.journalEntries.length > 0 ||
        snapshot.learningItems.length > 0);

  const scopedInsights = options?.moduleId
    ? output.insights.filter(
        (insight) => insight.relatedModule === options.moduleId || insight.relatedModule === "global",
      )
    : output.insights;

  const status: DataStatus =
    analytics.status === "error" || snapshotStatus === "error"
      ? "error"
      : analytics.status === "loading" || snapshotStatus === "loading"
        ? "loading"
        : "ready";

  return {
    status,
    error: analytics.error ?? snapshotError,
    reload: () => {
      analytics.reload();
      return load();
    },
    hasAnyData: rawHasData,
    insights: scopedInsights,
    today: output.today,
    progress: output.progress,
    attention: output.attention,
    patterns: output.patterns,
    recommendations: output.recommendations,
    moduleAttention: output.moduleAttention,
  };
}
