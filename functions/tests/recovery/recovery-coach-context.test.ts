import { describe, expect, it } from "vitest";
import { buildRecoveryCoachContext } from "../../src/recovery/recovery-coach-context";
import { asFirestore, createFakeFirestore } from "../ai/fakes";

describe("buildRecoveryCoachContext", () => {
  it("returns null when the goal doesn't exist for the caller", async () => {
    const context = await buildRecoveryCoachContext(
      asFirestore(createFakeFirestore()),
      "u1",
      "missing",
    );
    expect(context).toBeNull();
  });

  it("summarizes the goal, recent check-ins, setbacks, and coping toolkit", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1/recoveryGoals/g1", {
      behavior: "Late-night doomscrolling",
      motivation: "Sleep better",
      recoveryStatus: "challenging",
      triggers: ["Boredom", "Stress"],
      warningSigns: ["Picking up the phone in bed"],
      faithBasedEncouragement: true,
    });
    fake.seedDoc("users/u1/recoveryGoals/g1/checkIns/c1", {
      date: "2026-09-05",
      stayedOnTrack: false,
      urgeIntensity: 8,
      halt: { hungry: false, angry: false, lonely: true, tired: true },
      status: "active",
    });
    fake.seedDoc("users/u1/recoveryGoals/g1/relapses/r1", {
      date: "2026-09-01",
      restartPlan: "Charge the phone in the kitchen",
      status: "active",
    });
    fake.seedDoc("users/u1/recoveryGoals/g1/copingActions/a1", {
      title: "Box breathing",
      status: "active",
    });
    fake.seedDoc("users/u1/recoveryGoals/g1/copingActions/a2", {
      title: "Archived idea",
      status: "archived",
    });

    const context = await buildRecoveryCoachContext(asFirestore(fake), "u1", "g1");
    expect(context).not.toBeNull();
    expect(context!.faithBased).toBe(true);
    expect(context!.goalBehavior).toBe("Late-night doomscrolling");
    expect(context!.refs).toEqual([
      { collection: "recoveryGoals", id: "g1", label: "Late-night doomscrolling" },
    ]);
    expect(context!.text).toContain("Late-night doomscrolling");
    expect(context!.text).toContain("Boredom; Stress");
    expect(context!.text).toContain("2026-09-05");
    expect(context!.text).toContain("HALT: lonely, tired");
    expect(context!.text).toContain("Charge the phone in the kitchen");
    expect(context!.text).toContain("Box breathing");
    expect(context!.text).not.toContain("Archived idea");
  });

  it("reads only recovery collections — never the general planning data", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1/recoveryGoals/g1", { behavior: "A private goal" });
    fake.seedDoc("users/u1/goals/g99", { title: "Ship the product", status: "active" });
    fake.seedDoc("users/u1/journalEntries/j1", { title: "A private journal entry" });
    fake.seedDoc("users/u1/tasks/t1", { title: "Buy groceries" });

    const context = await buildRecoveryCoachContext(asFirestore(fake), "u1", "g1");
    expect(context!.text).not.toContain("Ship the product");
    expect(context!.text).not.toContain("private journal entry");
    expect(context!.text).not.toContain("Buy groceries");
  });
});
