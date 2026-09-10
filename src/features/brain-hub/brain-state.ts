import type { BrainModuleId, BrainModuleStatus } from "./brain-modules";

export type BrainOverallActivity = "idle" | "active" | "attention";

export interface BrainModuleSignal {
  itemCount: number;
  activeCount: number;
  completedCount: number;
  attentionCount: number;
  progress: number | null;
  lastUpdatedAt: string | null;
}

export interface BrainModuleVisual {
  status: BrainModuleStatus;
  progress: number | null;
  attentionCount: number;
  recentEvent: boolean;
  lastUpdatedAt: string | null;
}

export interface BrainSystemState {
  availability: "loading" | "ready" | "unavailable";
  source: "neutral" | "live";
  overallActivity: BrainOverallActivity;
  modules: Record<BrainModuleId, BrainModuleVisual>;
  message?: string;
}

const MODULE_IDS: BrainModuleId[] = ["goals", "plan", "focus", "act", "grow", "analytics"];

function clampProgress(value: number | null): number | null {
  if (value === null) return null;
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function deriveModuleStatus(signal: BrainModuleSignal): BrainModuleStatus {
  if (signal.itemCount === 0) return "normal";
  if (signal.attentionCount > 0) return "attention";
  if (signal.completedCount > 0 && signal.activeCount === 0) return "completed";
  if (signal.activeCount > 0) return "active";
  if (signal.progress !== null && signal.progress > 0) return "progress";
  return "normal";
}

export function deriveOverallActivity(modules: Record<BrainModuleId, BrainModuleVisual>): BrainOverallActivity {
  const statuses = MODULE_IDS.map((id) => modules[id].status);
  if (statuses.some((status) => status === "attention")) return "attention";
  if (statuses.some((status) => status === "active" || status === "progress")) return "active";
  return "idle";
}

export function makeNeutralBrainSystemState(
  availability: BrainSystemState["availability"] = "loading",
  message?: string,
): BrainSystemState {
  const modules = MODULE_IDS.reduce(
    (acc, id) => {
      acc[id] = {
        status: availability === "unavailable" ? "unavailable" : "normal",
        progress: null,
        attentionCount: 0,
        recentEvent: false,
        lastUpdatedAt: null,
      };
      return acc;
    },
    {} as Record<BrainModuleId, BrainModuleVisual>,
  );

  return {
    availability,
    source: "neutral",
    overallActivity: "idle",
    modules,
    message,
  };
}

export function buildBrainSystemState(
  signals: Record<BrainModuleId, BrainModuleSignal>,
  recentEvents: Partial<Record<BrainModuleId, boolean>> = {},
): BrainSystemState {
  const modules = MODULE_IDS.reduce(
    (acc, id) => {
      const signal = signals[id];
      const progress = clampProgress(signal.progress);
      acc[id] = {
        status: deriveModuleStatus({ ...signal, progress }),
        progress,
        attentionCount: signal.attentionCount,
        recentEvent: recentEvents[id] === true,
        lastUpdatedAt: signal.lastUpdatedAt,
      };
      return acc;
    },
    {} as Record<BrainModuleId, BrainModuleVisual>,
  );

  return {
    availability: "ready",
    source: "live",
    overallActivity: deriveOverallActivity(modules),
    modules,
  };
}
