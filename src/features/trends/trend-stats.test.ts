import { describe, expect, it } from "vitest";
import { summarizeTrend } from "./trend-stats";

describe("summarizeTrend", () => {
  it("returns null for an empty series", () => {
    expect(summarizeTrend([])).toBeNull();
  });

  it("computes min/max/avg/first/last/change over a chronological series", () => {
    expect(summarizeTrend([4, 8, 2, 6])).toEqual({
      min: 2,
      max: 8,
      avg: 5,
      first: 4,
      last: 6,
      change: 2,
    });
  });

  it("handles a single-point series with zero change", () => {
    expect(summarizeTrend([7])).toEqual({ min: 7, max: 7, avg: 7, first: 7, last: 7, change: 0 });
  });
});
