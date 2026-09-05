import { describe, expect, it } from "vitest";
import { summarizeRecoveryProgress } from "./recovery-progress";

function checkIn(date: string, stayedOnTrack: boolean, urgeIntensity = 0) {
  return { date, stayedOnTrack, urgeIntensity };
}

describe("summarizeRecoveryProgress", () => {
  it("returns zeros/null for no check-ins", () => {
    expect(summarizeRecoveryProgress([])).toEqual({
      checkInCount: 0,
      currentStreak: 0,
      longestStreak: 0,
      daysOnTrack: 0,
      averageUrge: null,
      lastCheckInDate: null,
    });
  });

  it("counts the current streak from the most recent day backward, stopping at a hard day", () => {
    const progress = summarizeRecoveryProgress([
      checkIn("2026-09-01", true),
      checkIn("2026-09-02", true),
      checkIn("2026-09-03", false),
      checkIn("2026-09-04", true),
      checkIn("2026-09-05", true),
      checkIn("2026-09-06", true),
    ]);
    expect(progress.currentStreak).toBe(3);
    expect(progress.longestStreak).toBe(3);
    expect(progress.daysOnTrack).toBe(5);
    expect(progress.checkInCount).toBe(6);
    expect(progress.lastCheckInDate).toBe("2026-09-06");
  });

  it("is order-independent and picks the true longest run", () => {
    const progress = summarizeRecoveryProgress([
      checkIn("2026-09-06", true),
      checkIn("2026-09-01", true),
      checkIn("2026-09-04", true),
      checkIn("2026-09-02", true),
      checkIn("2026-09-05", true),
      checkIn("2026-09-03", true),
    ]);
    expect(progress.currentStreak).toBe(6);
    expect(progress.longestStreak).toBe(6);
  });

  it("averages the urge intensity to one decimal", () => {
    const progress = summarizeRecoveryProgress([
      checkIn("2026-09-01", true, 2),
      checkIn("2026-09-02", true, 5),
      checkIn("2026-09-03", false, 8),
    ]);
    expect(progress.averageUrge).toBe(5);
  });
});
