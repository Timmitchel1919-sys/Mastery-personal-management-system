"use client";

import { useMemo, useState } from "react";
import { useBrainSystemState } from "@/features/brain-hub";
import { useDecisions } from "@/features/decisions";
import { useIntelligence } from "@/features/intelligence";
import { usePredictions } from "@/features/predictions";
import type { BrainSystemState } from "@/features/brain-hub";
import { buildCommandCenter, type CommandCenterState } from "./command-center-state";

/**
 * Layer N — the Command Center hook.
 *
 * Composes existing derived-state hooks (intelligence, predictions,
 * brain-system-state, decisions) and folds them through the pure
 * `buildCommandCenter` reducer. It issues no queries of its own: every source
 * already owns its loading / error handling, and a failing source degrades the
 * cockpit rather than breaking it.
 */
export function useCommandCenter(): {
  status: "loading" | "ready";
  state: CommandCenterState;
  brainState: BrainSystemState;
  reload: () => void;
} {
  const intelligence = useIntelligence();
  const predictions = usePredictions();
  const { state: brain, reload: reloadBrain } = useBrainSystemState();
  const { decisions } = useDecisions();

  const [nowIso] = useState(() => new Date().toISOString());

  const state = useMemo(
    () =>
      buildCommandCenter({
        nowIso,
        intelligence: {
          status: intelligence.status,
          hasAnyData: intelligence.hasAnyData,
          insights: intelligence.insights,
          today: intelligence.today,
          progress: intelligence.progress,
          attention: intelligence.attention,
          patterns: intelligence.patterns,
          recommendations: intelligence.recommendations,
        },
        predictions: {
          status: predictions.status,
          enabled: predictions.enabled,
          signals: predictions.signals,
        },
        brain,
        decisions,
      }),
    [
      nowIso,
      intelligence.status,
      intelligence.hasAnyData,
      intelligence.insights,
      intelligence.today,
      intelligence.progress,
      intelligence.attention,
      intelligence.patterns,
      intelligence.recommendations,
      predictions.status,
      predictions.enabled,
      predictions.signals,
      brain,
      decisions,
    ],
  );

  const status =
    intelligence.status === "loading" && brain.availability === "loading" ? "loading" : "ready";

  const reload = () => {
    intelligence.reload();
    predictions.reload();
    void reloadBrain();
  };

  return { status, state, brainState: brain, reload };
}
