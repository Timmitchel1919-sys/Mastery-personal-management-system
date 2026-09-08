"use client";

import { useEffect, useMemo, useState } from "react";
import { readActionHistory } from "@/features/actions";
import type { ActionRecord } from "@/features/actions/action-model";
import { ANALYTICS_PERIODS, useAnalytics } from "@/features/analytics";
import {
  acceptanceFromHistory,
  buildPersonalPatterns,
  detectSignificantChange,
  type PersonalPattern,
} from "./personal-signals";
import { usePersonalizationSettings } from "./personalization-store";

/**
 * The adaptive layer. Reuses `useAnalytics` (no new data fetching) and the
 * Layer 10 action history, then derives personal patterns — gated by the user's
 * personalization switches and rejected-pattern list. Everything is memoised.
 */
export function usePersonalization() {
  const analytics = useAnalytics();
  const { settings, isRejected, rejectPattern, allowPattern, resetPersonalization, setSetting } =
    usePersonalizationSettings();

  // The action history is per-viewer localStorage; read it once on mount.
  const [history, setHistory] = useState<ActionRecord[]>([]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setHistory(readActionHistory()));
    return () => cancelAnimationFrame(frame);
  }, []);

  const periodLabel = (
    ANALYTICS_PERIODS.find((option) => option.value === analytics.period)?.label ?? "period"
  ).toLowerCase();

  const allPatterns: PersonalPattern[] = useMemo(
    () =>
      buildPersonalPatterns({
        metrics: analytics.metrics,
        lifeScore: analytics.lifeScoreComparison,
        periodLabel,
        history,
      }),
    [analytics.metrics, analytics.lifeScoreComparison, periodLabel, history],
  );

  const patterns = useMemo(() => {
    if (!settings.personalizedRecommendations) return [];
    return allPatterns.filter((pattern) => !isRejected(pattern.id));
  }, [allPatterns, settings.personalizedRecommendations, isRejected]);

  const acceptance = useMemo(() => acceptanceFromHistory(history), [history]);

  const change = useMemo(
    () => detectSignificantChange(analytics.metrics, periodLabel),
    [analytics.metrics, periodLabel],
  );

  return {
    status: analytics.status,
    error: analytics.error,
    reload: analytics.reload,
    hasAnyData: analytics.hasAnyData,
    settings,
    setSetting,
    patterns,
    /** Unfiltered — for the inspector, which shows what exists regardless of switches. */
    allPatterns,
    acceptance,
    change,
    isRejected,
    rejectPattern,
    allowPattern,
    resetPersonalization,
  };
}
