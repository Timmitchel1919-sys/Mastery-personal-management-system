import { describe, expect, it } from "vitest";
import { buildAccountabilityProjection } from "../../src/recovery/accountability-projection";
import { asFirestore, createFakeFirestore } from "../ai/fakes";

const now = new Date("2026-09-05T12:00:00.000Z");

describe("buildAccountabilityProjection", () => {
  it("returns null when the shared goal doesn't exist", async () => {
    const result = await buildAccountabilityProjection(
      asFirestore(createFakeFirestore()),
      "owner1",
      { goalId: "missing", scope: "streak-only" },
      now,
    );
    expect(result).toBeNull();
  });

  it("breaks the current streak on the most recent hard day", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/owner1/recoveryGoals/g1", { behavior: "x", recoveryStatus: "challenging" });
    fake.seedDoc("users/owner1/recoveryGoals/g1/checkIns/c1", {
      date: "2026-09-05",
      stayedOnTrack: false,
      status: "active",
    });
    fake.seedDoc("users/owner1/recoveryGoals/g1/checkIns/c2", {
      date: "2026-09-04",
      stayedOnTrack: true,
      status: "active",
    });

    const p = await buildAccountabilityProjection(
      asFirestore(fake),
      "owner1",
      { goalId: "g1", scope: "selected-summary" },
      now,
    );
    expect(p?.currentStreak).toBe(0);
    expect(p?.daysOnTrack).toBe(1);
    expect(p?.lastCheckInDate).toBe("2026-09-05");
  });

  it("never fills fields outside the requested scope", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/owner1/recoveryGoals/g1", { behavior: "x", recoveryStatus: "going-well" });
    const p = await buildAccountabilityProjection(
      asFirestore(fake),
      "owner1",
      { goalId: "g1", scope: "status-only" },
      now,
    );
    expect(p).toMatchObject({
      recoveryStatus: "going-well",
      currentStreak: null,
      daysOnTrack: null,
      checkedInToday: null,
      lastCheckInDate: null,
      setbackCount: null,
    });
  });
});
