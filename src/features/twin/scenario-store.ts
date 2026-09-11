"use client";

import { useCallback, useState } from "react";
import type { Assumption, Scenario, ScenarioChange, ScenarioStatus, SimHorizon } from "./digital-twin";

/**
 * Layer Q — scenario library.
 *
 * Per-viewer, localStorage-backed scenario definitions (the same pattern as
 * decisions / context notes). Saved scenarios are NOT plans — they are sandboxed
 * what-if configurations with a status and a version. Applying one is a separate,
 * explicit step handled elsewhere; this store only tracks the definition and its
 * lifecycle.
 */

const KEY = "mastery.twin.scenarios";

function read(): Scenario[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as Scenario[]) : [];
  } catch {
    return [];
  }
}

function write(scenarios: Scenario[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(scenarios));
  } catch {
    // per-viewer convenience only
  }
}

function newId(): string {
  return `scn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface NewScenario {
  name: string;
  horizon: SimHorizon;
  changes: ScenarioChange[];
  assumptions: Assumption[];
}

export function useScenarioLibrary() {
  const [scenarios, setScenarios] = useState<Scenario[]>(() => read());

  const persist = useCallback((next: Scenario[]) => {
    setScenarios(next);
    write(next);
  }, []);

  const create = useCallback(
    (input: NewScenario) => {
      const now = new Date().toISOString();
      const scenario: Scenario = {
        id: newId(),
        name: input.name.trim() || "Untitled scenario",
        horizon: input.horizon,
        changes: input.changes,
        assumptions: input.assumptions,
        status: "DRAFT",
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
      persist([scenario, ...scenarios]);
      return scenario;
    },
    [scenarios, persist],
  );

  const update = useCallback(
    (id: string, patch: Partial<Omit<Scenario, "id" | "createdAt" | "version">>) => {
      persist(
        scenarios.map((scenario) =>
          scenario.id === id
            ? { ...scenario, ...patch, updatedAt: new Date().toISOString() }
            : scenario,
        ),
      );
    },
    [scenarios, persist],
  );

  const setStatus = useCallback(
    (id: string, status: ScenarioStatus) => update(id, { status }),
    [update],
  );

  const remove = useCallback(
    (id: string) => persist(scenarios.filter((scenario) => scenario.id !== id)),
    [scenarios, persist],
  );

  /** New scenario carrying the previous definition forward as the next version. */
  const duplicate = useCallback(
    (id: string) => {
      const source = scenarios.find((scenario) => scenario.id === id);
      if (!source) return null;
      const now = new Date().toISOString();
      const copy: Scenario = {
        ...source,
        id: newId(),
        name: `${source.name} v${source.version + 1}`,
        version: source.version + 1,
        status: "DRAFT",
        createdAt: now,
        updatedAt: now,
      };
      persist([copy, ...scenarios]);
      return copy;
    },
    [scenarios, persist],
  );

  return { scenarios, create, update, setStatus, remove, duplicate };
}
