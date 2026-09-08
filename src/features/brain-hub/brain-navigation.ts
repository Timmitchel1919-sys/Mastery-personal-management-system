"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BRAIN_MODULES,
  brainModule,
  nodePosition,
  type BrainHubPhase,
  type BrainModule,
  type BrainModuleId,
  type BrainModuleStatus,
} from "./brain-modules";

/**
 * Navigation-state contract for the Mastery Brain Hub.
 *
 *   Application state  →  Navigation state (this module)  →  BrainHub  →  BrainScene / renderer
 *
 * React/application state is authoritative. The renderer only reads
 * `selectedId` / `activeId` / `phase` and draws accordingly — it never becomes
 * the source of truth for navigation, and it never touches auth, the database,
 * or module business logic.
 *
 * Static data + geometry live in `./brain-modules` (a non-client module so the
 * server-side `/hub` build can import them); this file re-exports them so
 * existing `from "../brain-navigation"` imports keep working.
 */

export {
  BRAIN_MODULES,
  brainModule,
  nodePosition,
  type BrainHubPhase,
  type BrainModule,
  type BrainModuleId,
  type BrainModuleStatus,
};

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
