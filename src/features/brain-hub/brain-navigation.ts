"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BarChart3, CheckSquare, Compass, Sprout, Target, Timer, type LucideIcon } from "lucide-react";

/**
 * Navigation-state contract for the Mastery Brain Hub.
 *
 *   Application state  →  Navigation state (this module)  →  BrainHub  →  BrainScene / renderer
 *
 * React/application state is authoritative. The renderer only reads
 * `selectedId` / `activeId` / `phase` and draws accordingly — it never becomes
 * the source of truth for navigation, and it never touches auth, the database,
 * or module business logic.
 */

export type BrainModuleId = "goals" | "plan" | "focus" | "act" | "grow" | "analytics";

/** Reserved for a future real signal. Never fabricated — populated only when the
 * app can supply it. `normal` renders no indicator. */
export type BrainModuleStatus = "normal" | "attention" | "active";

export interface BrainModule {
  id: BrainModuleId;
  label: string;
  /** Existing module route — used only by the explicit "open" action. */
  href: string;
  icon: LucideIcon;
  /**
   * Angle in degrees clockwise from straight up, for radial placement:
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

/**
 * The three states of the spatial navigation:
 *  - `home`          — the brain hub, all six modules equal.
 *  - `transitioning` — a module was chosen; the camera is interpolating.
 *  - `module-active` — the camera has settled; the chosen module dominates.
 */
export type BrainHubPhase = "home" | "transitioning" | "module-active";

export interface BrainNavigationState {
  /** The module whose node is spatially activated. `null` in `home`. */
  selectedId: BrainModuleId | null;
  /** Hovered / keyboard-focused module — drives emphasis + the hover preview. */
  activeId: BrainModuleId | null;
  phase: BrainHubPhase;
  /** Choose a module: begins the spatial transition. Does NOT navigate. */
  enterModule: (id: BrainModuleId) => void;
  /** Return toward the HOME brain state (also the ESC handler's action). */
  returnHome: () => void;
  /** The explicit "open this module" action — the only thing that navigates. */
  openSelected: () => void;
  setActive: (id: BrainModuleId | null) => void;
  /** Alias for `enterModule`, kept for existing callers. */
  select: (id: BrainModuleId) => void;
}

interface UseBrainNavigationOptions {
  initialSelectedId?: BrainModuleId | null;
  /** Where "open the selected module" goes. Kept out of this hook so it stays
   * free of routing / app concerns. */
  onOpen?: (module: BrainModule) => void;
  /** Camera-settle delay in ms (ignored under reduced motion). */
  transitionMs?: number;
  reducedMotion?: boolean;
}

/**
 * Local spatial-navigation state for one BrainHub instance. Owns the phase state
 * machine, the selection, and the ESC-to-home behaviour. Nothing here renders or
 * routes.
 */
export function useBrainNavigation(options?: UseBrainNavigationOptions): BrainNavigationState {
  const { initialSelectedId = null, onOpen, transitionMs = 420, reducedMotion = false } =
    options ?? {};

  const [selectedId, setSelectedId] = useState<BrainModuleId | null>(initialSelectedId);
  const [activeId, setActiveId] = useState<BrainModuleId | null>(null);
  const [phase, setPhase] = useState<BrainHubPhase>(
    initialSelectedId ? "module-active" : "home",
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const enterModule = useCallback(
    (id: BrainModuleId) => {
      clearTimer();
      setSelectedId(id);
      if (reducedMotion) {
        setPhase("module-active");
        return;
      }
      setPhase("transitioning");
      timer.current = setTimeout(() => {
        timer.current = null;
        setPhase("module-active");
      }, transitionMs);
    },
    [clearTimer, reducedMotion, transitionMs],
  );

  const returnHome = useCallback(() => {
    clearTimer();
    setPhase("home");
    setSelectedId(null);
    setActiveId(null);
  }, [clearTimer]);

  const openSelected = useCallback(() => {
    if (selectedId) onOpen?.(brainModule(selectedId));
  }, [selectedId, onOpen]);

  const setActive = useCallback((id: BrainModuleId | null) => setActiveId(id), []);

  // ESC returns toward home whenever a module is engaged. Never navigates away.
  useEffect(() => {
    if (phase === "home") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        returnHome();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, returnHome]);

  useEffect(() => clearTimer, [clearTimer]);

  return {
    selectedId,
    activeId,
    phase,
    enterModule,
    returnHome,
    openSelected,
    setActive,
    select: enterModule,
  };
}
