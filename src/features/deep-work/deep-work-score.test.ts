import { describe, expect, it } from "vitest";
import { computeSessionScore } from "./deep-work-score";

const base = {
  sessionStatus: "completed" as const,
  focusQuality: 3,
  energyLevel: 3,
  plannedMinutes: 60,
  actualMinutes: 60,
  distractions: [] as string[],
};

describe("computeSessionScore", () => {
  it("returns null until the session is completed", () => {
    expect(computeSessionScore({ ...base, sessionStatus: "planned" })).toBeNull();
    expect(computeSessionScore({ ...base, sessionStatus: "in-progress" })).toBeNull();
  });

  it("is 100 for a perfect session", () => {
    expect(
      computeSessionScore({
        ...base,
        focusQuality: 5,
        energyLevel: 5,
        actualMinutes: 60,
        distractions: [],
      }),
    ).toBe(100);
  });

  it("drops with poor focus, low energy, short time, and distractions", () => {
    const weak = computeSessionScore({
      ...base,
      focusQuality: 2,
      energyLevel: 2,
      actualMinutes: 30,
      distractions: ["a", "b", "c"],
    });
    expect(weak).not.toBeNull();
    expect(weak as number).toBeLessThan(60);
  });

  it("treats over-running the plan as full adherence, not a bonus", () => {
    const onPlan = computeSessionScore({ ...base, actualMinutes: 60 });
    const overPlan = computeSessionScore({ ...base, actualMinutes: 120 });
    expect(overPlan).toBe(onPlan);
  });
});
