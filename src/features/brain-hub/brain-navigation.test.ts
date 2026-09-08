import { describe, expect, it } from "vitest";
import { BRAIN_MODULES, brainModule, nodePosition, type BrainModuleId } from "./brain-navigation";

describe("BRAIN_MODULES", () => {
  it("has the six main modules with unique ids and real routes", () => {
    expect(BRAIN_MODULES.map((m) => m.id)).toEqual([
      "goals",
      "plan",
      "focus",
      "act",
      "grow",
      "analytics",
    ]);
    const hrefs = BRAIN_MODULES.map((m) => m.href);
    expect(new Set(hrefs).size).toBe(6);
    expect(hrefs.every((h) => h.startsWith("/"))).toBe(true);
  });

  it("resolves a module by id and throws for an unknown one", () => {
    expect(brainModule("focus").href).toBe("/focus");
    expect(() => brainModule("nope" as BrainModuleId)).toThrow(/unknown brain module/i);
  });
});

describe("nodePosition", () => {
  it("places angle 0 at the top and 180 at the bottom", () => {
    const top = nodePosition(0, 40);
    expect(top.x).toBeCloseTo(50);
    expect(top.y).toBeCloseTo(10);

    const bottom = nodePosition(180, 40);
    expect(bottom.x).toBeCloseTo(50);
    expect(bottom.y).toBeCloseTo(90);
  });

  it("places angle 90 to the right", () => {
    const right = nodePosition(90, 40);
    expect(right.x).toBeCloseTo(90);
    expect(right.y).toBeCloseTo(50);
  });

  it("collapses to the centre at radius 0", () => {
    expect(nodePosition(125, 0)).toEqual({ x: 50, y: 50 });
  });
});
