import { describe, expect, it } from "vitest";
import {
  buildBrainSystemState,
  deriveModuleStatus,
  deriveOverallActivity,
  makeNeutralBrainSystemState,
  type BrainModuleSignal,
} from "./brain-state";

const BASE_SIGNAL: BrainModuleSignal = {
  itemCount: 0,
  activeCount: 0,
  completedCount: 0,
  attentionCount: 0,
  progress: null,
  lastUpdatedAt: null,
};

describe("brain-state", () => {
  it("derives module status from real signal priority: attention > completed > active > progress", () => {
    expect(deriveModuleStatus({ ...BASE_SIGNAL, itemCount: 3, attentionCount: 1 })).toBe("attention");
    expect(deriveModuleStatus({ ...BASE_SIGNAL, itemCount: 3, completedCount: 3 })).toBe("completed");
    expect(deriveModuleStatus({ ...BASE_SIGNAL, itemCount: 3, activeCount: 2 })).toBe("active");
    expect(deriveModuleStatus({ ...BASE_SIGNAL, itemCount: 3, progress: 42 })).toBe("progress");
    expect(deriveModuleStatus(BASE_SIGNAL)).toBe("normal");
  });

  it("computes overall activity from module visual states", () => {
    const idle = makeNeutralBrainSystemState("ready").modules;
    expect(deriveOverallActivity(idle)).toBe("idle");

    const active = {
      ...idle,
      plan: { ...idle.plan, status: "active" as const },
    };
    expect(deriveOverallActivity(active)).toBe("active");

    const attention = {
      ...active,
      act: { ...active.act, status: "attention" as const },
    };
    expect(deriveOverallActivity(attention)).toBe("attention");
  });

  it("builds a ready state, clamps progress, and preserves event pulses", () => {
    const state = buildBrainSystemState(
      {
        goals: { ...BASE_SIGNAL, itemCount: 1, progress: 150 },
        plan: { ...BASE_SIGNAL, itemCount: 1, activeCount: 1, progress: 20 },
        focus: { ...BASE_SIGNAL, itemCount: 1, attentionCount: 2, progress: 60 },
        act: { ...BASE_SIGNAL, itemCount: 1, completedCount: 1, progress: 100 },
        grow: { ...BASE_SIGNAL, itemCount: 1, progress: -4 },
        analytics: { ...BASE_SIGNAL, itemCount: 0, progress: null },
      },
      { focus: true },
    );

    expect(state.availability).toBe("ready");
    expect(state.source).toBe("live");
    expect(state.modules.goals.progress).toBe(100);
    expect(state.modules.grow.progress).toBe(0);
    expect(state.modules.focus.recentEvent).toBe(true);
    expect(state.modules.analytics.status).toBe("normal");
    expect(state.overallActivity).toBe("attention");
  });

  it("creates neutral unavailable state without fake status", () => {
    const state = makeNeutralBrainSystemState("unavailable", "System status unavailable");
    expect(state.source).toBe("neutral");
    expect(state.modules.goals.status).toBe("unavailable");
    expect(state.modules.plan.progress).toBeNull();
    expect(state.message).toMatch(/unavailable/i);
  });
});
