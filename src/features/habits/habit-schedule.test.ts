import { describe, expect, it } from "vitest";
import { expectedDatesInRange, isExpectedOn } from "./habit-schedule";

const daily = { frequency: "daily" as const, interval: 1, weekdays: [], daysOfMonth: [] };
const everyThreeDays = { ...daily, interval: 3 };
const weeklyMonWed = {
  frequency: "weekly" as const,
  interval: 1,
  weekdays: [1, 3],
  daysOfMonth: [],
};
const weeklyAnyDay = { frequency: "weekly" as const, interval: 1, weekdays: [], daysOfMonth: [] };
const monthly1And15 = {
  frequency: "monthly" as const,
  interval: 1,
  weekdays: [],
  daysOfMonth: [1, 15],
};

describe("isExpectedOn", () => {
  it("daily: every day is expected on and after the anchor, none before", () => {
    expect(isExpectedOn(daily, "2026-09-01", "2026-09-01")).toBe(true);
    expect(isExpectedOn(daily, "2026-09-01", "2026-09-05")).toBe(true);
    expect(isExpectedOn(daily, "2026-09-01", "2026-08-31")).toBe(false);
  });

  it("daily with an interval: only every Nth day from the anchor", () => {
    expect(isExpectedOn(everyThreeDays, "2026-09-01", "2026-09-01")).toBe(true);
    expect(isExpectedOn(everyThreeDays, "2026-09-01", "2026-09-02")).toBe(false);
    expect(isExpectedOn(everyThreeDays, "2026-09-01", "2026-09-04")).toBe(true);
  });

  it("weekly with weekdays: only those weekdays (anchor 2026-08-31 is a Monday)", () => {
    expect(isExpectedOn(weeklyMonWed, "2026-08-31", "2026-08-31")).toBe(true); // Monday
    expect(isExpectedOn(weeklyMonWed, "2026-08-31", "2026-09-01")).toBe(false); // Tuesday
    expect(isExpectedOn(weeklyMonWed, "2026-08-31", "2026-09-02")).toBe(true); // Wednesday
  });

  it("weekly with no weekdays selected: every day counts", () => {
    expect(isExpectedOn(weeklyAnyDay, "2026-09-01", "2026-09-04")).toBe(true);
  });

  it("monthly: only the configured days of month; empty defaults to day 1", () => {
    expect(isExpectedOn(monthly1And15, "2026-09-01", "2026-09-01")).toBe(true);
    expect(isExpectedOn(monthly1And15, "2026-09-01", "2026-09-15")).toBe(true);
    expect(isExpectedOn(monthly1And15, "2026-09-01", "2026-09-02")).toBe(false);
    expect(
      isExpectedOn(
        { frequency: "monthly", interval: 1, weekdays: [], daysOfMonth: [] },
        "2026-09-01",
        "2026-10-01",
      ),
    ).toBe(true);
  });
});

describe("expectedDatesInRange", () => {
  it("lists expected dates within the range, clamped to the anchor", () => {
    expect(expectedDatesInRange(everyThreeDays, "2026-09-01", "2026-09-01", "2026-09-07")).toEqual([
      "2026-09-01",
      "2026-09-04",
      "2026-09-07",
    ]);
  });

  it("returns an empty list when the range ends before the anchor", () => {
    expect(expectedDatesInRange(daily, "2026-09-10", "2026-09-01", "2026-09-05")).toEqual([]);
  });
});
