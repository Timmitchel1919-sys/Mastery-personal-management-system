import { describe, expect, it } from "vitest";
import type { BrainModuleId } from "./brain-navigation";
import { MODULE_REGISTRY, moduleDef, submoduleDef } from "./module-registry";

const IDS: BrainModuleId[] = ["goals", "plan", "focus", "act", "grow", "analytics"];

describe("MODULE_REGISTRY", () => {
  it("has an entry for each of the six brain modules", () => {
    expect(Object.keys(MODULE_REGISTRY).sort()).toEqual([...IDS].sort());
  });

  it("gives every module a title, description, icon and at least one submodule", () => {
    for (const id of IDS) {
      const mod = MODULE_REGISTRY[id];
      expect(mod.title.length).toBeGreaterThan(0);
      expect(mod.description.length).toBeGreaterThan(0);
      expect(mod.icon).toBeTypeOf("object");
      expect(mod.submodules.length).toBeGreaterThan(0);
    }
  });

  it("points every submodule at an existing route with an id derived from it", () => {
    for (const id of IDS) {
      for (const sub of MODULE_REGISTRY[id].submodules) {
        expect(sub.href.startsWith("/")).toBe(true);
        expect(sub.href.endsWith(sub.id)).toBe(true);
        expect(sub.title.length).toBeGreaterThan(0);
      }
    }
  });

  it("wires the real Focus submodules from the nav config", () => {
    const focus = moduleDef("focus");
    expect(focus.submodules.map((s) => s.id)).toEqual(
      expect.arrayContaining(["deep-work", "pomodoro", "priority-matrix", "calendar", "time-blocking", "sessions"]),
    );
    // sessions is still a placeholder screen (Layer 7 audit).
    expect(submoduleDef("focus", "sessions").available).toBe(false);
    expect(submoduleDef("focus", "deep-work").available).toBe(true);
  });

  it("throws for an unknown module or submodule", () => {
    expect(() => moduleDef("nope" as BrainModuleId)).toThrow(/unknown module/i);
    expect(() => submoduleDef("focus", "nope")).toThrow(/unknown submodule/i);
  });
});
