"use client";

import { useCallback, useState } from "react";
import { BarChart3, CheckSquare, Compass, Sprout, Target, Timer, type LucideIcon } from "lucide-react";

/**
 * Navigation-state contract for the Mastery Brain Hub.
 *
 *   Application state  →  Navigation state (this module)  →  BrainHub  →  BrainScene
 *
 * This layer owns ONLY which of the six main modules is hovered / selected. It
 * never touches auth, database, or module business logic. The renderer
 * (`BrainScene`) consumes this state and is a swappable boundary — a future
 * WebGL brain can replace it without changing anything here.
 */

export type BrainModuleId = "goals" | "plan" | "focus" | "act" | "grow" | "analytics";

export interface BrainModule {
  id: BrainModuleId;
  label: string;
  /** Existing module route — selection navigates here (real routes, no new screens). */
  href: string;
  icon: LucideIcon;
  /**
   * Angle in degrees clockwise from straight up, for radial placement around the
   * brain. Matches the requested layout:
   *
   *              GOALS (0°)
   *      PLAN (-55°)     FOCUS (55°)
   *              🧠
   *      ACT (-125°)     GROW (125°)
   *            ANALYTICS (180°)
   */
  angle: number;
}

export const BRAIN_MODULES: BrainModule[] = [
  { id: "goals", label: "Goals", href: "/plan/goals", icon: Target, angle: 0 },
  { id: "plan", label: "Plan", href: "/plan", icon: Compass, angle: -55 },
  { id: "focus", label: "Focus", href: "/focus", icon: Timer, angle: 55 },
  { id: "act", label: "Act", href: "/act", icon: CheckSquare, angle: -125 },
  { id: "grow", label: "Grow", href: "/grow", icon: Sprout, angle: 125 },
  { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3, angle: 180 },
];

export function brainModule(id: BrainModuleId): BrainModule {
  const found = BRAIN_MODULES.find((module) => module.id === id);
  if (!found) throw new Error(`Unknown brain module: ${id}`);
  return found;
}

/**
 * Radial position for a node, as percentages of the square stage.
 * `angle` is degrees clockwise from straight up; `radius` is 0–50 (% of half-size).
 */
export function nodePosition(angle: number, radius: number): { x: number; y: number } {
  const rad = (angle * Math.PI) / 180;
  return {
    x: 50 + radius * Math.sin(rad),
    y: 50 - radius * Math.cos(rad),
  };
}

export interface BrainNavigationState {
  /** The module whose node is visually activated. `null` until the user picks one. */
  selectedId: BrainModuleId | null;
  /** The module currently hovered or keyboard-focused. */
  activeId: BrainModuleId | null;
  select: (id: BrainModuleId) => void;
  clearSelection: () => void;
  setActive: (id: BrainModuleId | null) => void;
}

/**
 * Local navigation state for one BrainHub instance. `onSelect` is where the host
 * decides what selection *means* (navigate, or — in Layer B — start a zoom
 * transition). Layer A only wires the state + the visual activation.
 */
export function useBrainNavigation(options?: {
  initialSelectedId?: BrainModuleId | null;
  onSelect?: (module: BrainModule) => void;
}): BrainNavigationState {
  const [selectedId, setSelectedId] = useState<BrainModuleId | null>(
    options?.initialSelectedId ?? null,
  );
  const [activeId, setActiveId] = useState<BrainModuleId | null>(null);
  const onSelect = options?.onSelect;

  const select = useCallback(
    (id: BrainModuleId) => {
      setSelectedId(id);
      onSelect?.(brainModule(id));
    },
    [onSelect],
  );

  const clearSelection = useCallback(() => setSelectedId(null), []);
  const setActive = useCallback((id: BrainModuleId | null) => setActiveId(id), []);

  return { selectedId, activeId, select, clearSelection, setActive };
}
