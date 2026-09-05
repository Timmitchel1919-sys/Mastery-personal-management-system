import { describe, expect, it } from "vitest";
import {
  inRange,
  localDateKey,
  localWeekday,
  pastWeekRange,
} from "../../src/scheduled/weekly-summary/week-window";

describe("localWeekday", () => {
  it("resolves the weekday in the given timezone, not the machine's local zone", () => {
    // 2026-09-07 is a Monday.
    expect(localWeekday(new Date("2026-09-07T12:00:00.000Z"), "UTC")).toBe("Mon");
    expect(localWeekday(new Date("2026-09-06T23:30:00.000Z"), "Pacific/Auckland")).toBe("Mon");
  });
});

describe("localDateKey", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(localDateKey(new Date("2026-09-07T12:00:00.000Z"), "UTC")).toBe("2026-09-07");
  });
});

describe("pastWeekRange", () => {
  it("covers the 7 calendar days before today, ending exclusive on today", () => {
    const range = pastWeekRange(new Date("2026-09-07T01:00:00.000Z"), "UTC");
    expect(range).toEqual({ startIso: "2026-08-31", endIso: "2026-09-07" });
  });
});

describe("inRange", () => {
  const range = { startIso: "2026-08-31", endIso: "2026-09-07" };

  it("is inclusive of the start and exclusive of the end", () => {
    expect(inRange("2026-08-31", range)).toBe(true);
    expect(inRange("2026-09-06", range)).toBe(true);
    expect(inRange("2026-09-07", range)).toBe(false);
    expect(inRange("2026-08-30", range)).toBe(false);
  });

  it("is false for null", () => {
    expect(inRange(null, range)).toBe(false);
  });
});
