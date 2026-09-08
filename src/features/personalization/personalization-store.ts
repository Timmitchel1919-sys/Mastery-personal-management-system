"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Per-viewer personalization preferences and rejected-pattern list.
 *
 * There is no server preference store beyond the user profile (name / locale /
 * timezone / photo), so — like `mastery.theme` and the Layer 9/10 dismiss lists —
 * this lives in `localStorage`. It is deliberately minimal and purpose-specific:
 * three on/off switches and the ids of patterns the user has said are not
 * accurate. Nothing here is inferred and nothing consequential is stored.
 */

const SETTINGS_KEY = "mastery.personalization.settings";
const REJECTED_KEY = "mastery.personalization.rejected";

export interface PersonalizationSettings {
  /** Master switch for behaviour-derived recommendations. */
  personalizedRecommendations: boolean;
  /** Whether the dashboard may re-order by demonstrated usefulness. */
  adaptiveDashboard: boolean;
  /** Whether recommendations may cite an observed behavioural pattern. */
  behaviorRecommendations: boolean;
  /** Master switch for forward-looking predictive signals (Layer 12). */
  predictiveInsights: boolean;
  /** Whether goals nearing their target date may raise a deadline signal. */
  deadlineWarnings: boolean;
  /** Whether overloaded days may raise a capacity signal. */
  capacityWarnings: boolean;
  /** Whether goal pace vs. target date may raise a trajectory signal. */
  goalTrajectory: boolean;
}

export const DEFAULT_SETTINGS: PersonalizationSettings = {
  personalizedRecommendations: true,
  adaptiveDashboard: true,
  behaviorRecommendations: true,
  predictiveInsights: true,
  deadlineWarnings: true,
  capacityWarnings: true,
  goalTrajectory: true,
};

// ── storage helpers ─────────────────────────────────────────────────────────

function readSettings(): PersonalizationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Record<keyof PersonalizationSettings, unknown>>;
    const result = { ...DEFAULT_SETTINGS };
    for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof PersonalizationSettings)[]) {
      if (typeof parsed[key] === "boolean") result[key] = parsed[key] as boolean;
    }
    return result;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function readRejected(): string[] {
  try {
    const raw = localStorage.getItem(REJECTED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

// ── external store plumbing ─────────────────────────────────────────────────

const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === SETTINGS_KEY || event.key === REJECTED_KEY || event.key === null) emit();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

const EMPTY_REJECTED: readonly string[] = [];
let settingsCache: PersonalizationSettings | null = null;
let rejectedCache: string[] | null = null;

function getSettingsSnapshot(): PersonalizationSettings {
  if (!settingsCache) settingsCache = readSettings();
  return settingsCache;
}
function getRejectedSnapshot(): string[] {
  if (!rejectedCache) rejectedCache = readRejected();
  return rejectedCache;
}

function write(next: PersonalizationSettings) {
  settingsCache = next;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // per-viewer convenience — safe to lose
  }
  emit();
}
function writeRejected(next: string[]) {
  rejectedCache = next;
  try {
    localStorage.setItem(REJECTED_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  emit();
}

// ── public API ─────────────────────────────────────────────────────────────

export function usePersonalizationSettings() {
  const settings = useSyncExternalStore(subscribe, getSettingsSnapshot, () => DEFAULT_SETTINGS);
  const rejectedList = useSyncExternalStore(
    subscribe,
    getRejectedSnapshot,
    () => EMPTY_REJECTED as string[],
  );

  const setSetting = useCallback(
    <K extends keyof PersonalizationSettings>(key: K, value: PersonalizationSettings[K]) => {
      write({ ...getSettingsSnapshot(), [key]: value });
    },
    [],
  );

  const rejectPattern = useCallback((id: string) => {
    const current = getRejectedSnapshot();
    if (!current.includes(id)) writeRejected([...current, id]);
  }, []);

  const allowPattern = useCallback((id: string) => {
    writeRejected(getRejectedSnapshot().filter((entry) => entry !== id));
  }, []);

  /** Re-enable every personalization switch and clear rejected patterns.
   * Does NOT touch tasks, goals, KPIs, or any core user data. */
  const resetPersonalization = useCallback(() => {
    write({ ...DEFAULT_SETTINGS });
    writeRejected([]);
  }, []);

  const isRejected = useCallback(
    (id: string) => rejectedList.includes(id),
    [rejectedList],
  );

  return {
    settings,
    rejected: rejectedList,
    isRejected,
    setSetting,
    rejectPattern,
    allowPattern,
    resetPersonalization,
  };
}
