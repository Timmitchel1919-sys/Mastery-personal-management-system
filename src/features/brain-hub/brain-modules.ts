import { BarChart3, CheckSquare, Compass, Sprout, Target, Timer, type LucideIcon } from "lucide-react";

/**
 * Static Brain Hub data + geometry. Deliberately NOT a `"use client"` module so
 * it can be imported from server components (e.g. the module registry pulled into
 * the `/hub` route) — importing an array across the RSC boundary from a client
 * module would hand back a client-reference proxy, not the array.
 *
 * Pure — no React, no I/O.
 */

export type BrainModuleId = "goals" | "plan" | "focus" | "act" | "grow" | "analytics";

/**
 * Visual status driven by real app signals. `normal` means neutral / no strong signal.
 * The renderer reads this only; data collection stays outside the renderer.
 */
export type BrainModuleStatus =
  | "normal"
  | "active"
  | "attention"
  | "progress"
  | "completed"
  | "unavailable";

/**
 * The three states of the spatial navigation:
 *  - `home`          — the brain hub, all six modules equal.
 *  - `transitioning` — a module was chosen; the camera is interpolating.
 *  - `module-active` — the camera has settled; the chosen module dominates.
 */
export type BrainHubPhase = "home" | "transitioning" | "module-active";

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
