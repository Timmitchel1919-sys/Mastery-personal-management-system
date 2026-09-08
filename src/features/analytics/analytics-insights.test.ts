import { describe, expect, it } from "vitest";
import {
  comparePeriods,
  deriveAttention,
  deriveKeyInsight,
  derivePositive,
  isImprovement,
  periodDays,
  type MetricSummary,
  type PeriodComparison,
} from "./analytics-insights";

const NOW = new Date("2026-03-31T12:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString().slice(0, 10);

describe("periodDays", () => {
  it("maps periods to day counts, null for all-time", () => {
    expect(periodDays("7d")).toBe(7);
    expect(periodDays("30d")).toBe(30);
    expect(periodDays("90d")).toBe(90);
    expect(periodDays("all")).toBeNull();
  });
});

describe("comparePeriods", () => {
  it("returns an empty comparison for no data", () => {
    expect(comparePeriods([], "30d", NOW)).toMatchObject({
      current: null,
      previous: null,
      changePct: null,
      direction: "flat",
      sampleSize: 0,
    });
  });

  it("compares the latest current-window value to the latest previous-window value", () => {
    const series = [
      { date: daysAgo(40), value: 50 }, // previous window (30–60d)
      { date: daysAgo(35), value: 60 }, // previous window, latest
      { date: daysAgo(10), value: 72 }, // current window
      { date: daysAgo(2), value: 90 }, // current window, latest
    ];
    const result = comparePeriods(series, "30d", NOW);
    expect(result.current).toBe(90);
    expect(result.previous).toBe(60);
    expect(result.changeAbs).toBe(30);
    expect(result.changePct).toBe(50);
    expect(result.direction).toBe("up");
    expect(result.sampleSize).toBe(2);
  });

  it("has no previous value when history does not reach back a full window", () => {
    const result = comparePeriods([{ date: daysAgo(3), value: 10 }], "30d", NOW);
    expect(result.current).toBe(10);
    expect(result.previous).toBeNull();
    expect(result.changePct).toBeNull();
    expect(result.direction).toBe("flat");
  });

  it("for all-time, compares first and last points", () => {
    const series = [
      { date: daysAgo(200), value: 20 },
      { date: daysAgo(120), value: 30 },
      { date: daysAgo(4), value: 12 },
    ];
    const result = comparePeriods(series, "all", NOW);
    expect(result.previous).toBe(20);
    expect(result.current).toBe(12);
    expect(result.direction).toBe("down");
    expect(result.sampleSize).toBe(3);
  });

  it("leaves changePct null when the previous value is zero", () => {
    const series = [
      { date: daysAgo(40), value: 0 },
      { date: daysAgo(2), value: 5 },
    ];
    expect(comparePeriods(series, "30d", NOW).changePct).toBeNull();
  });
});

function metric(over: {
  id: string;
  label?: string;
  unit?: string;
  higherIsBetter?: boolean;
  comparison?: Partial<PeriodComparison>;
}): MetricSummary {
  return {
    id: over.id,
    label: over.label ?? over.id,
    unit: over.unit ?? "",
    higherIsBetter: over.higherIsBetter ?? true,
    comparison: {
      current: 10,
      previous: 8,
      changeAbs: 2,
      changePct: 25,
      direction: "up",
      sampleSize: 5,
      ...over.comparison,
    },
  };
}

describe("isImprovement", () => {
  it("is true when a higher-is-better metric rises", () => {
    expect(isImprovement(metric({ id: "focus", higherIsBetter: true }))).toBe(true);
  });
  it("is false when a lower-is-better metric rises", () => {
    expect(isImprovement(metric({ id: "overdue", higherIsBetter: false }))).toBe(false);
  });
  it("is null when flat", () => {
    expect(
      isImprovement(
        metric({ id: "x", comparison: { changeAbs: 0, changePct: 0, direction: "flat" } }),
      ),
    ).toBeNull();
  });
});

describe("deriveKeyInsight", () => {
  it("says so when there is not enough data", () => {
    const insight = deriveKeyInsight([metric({ id: "a", comparison: { sampleSize: 1 } })]);
    expect(insight.headline).toBe("No clear pattern yet.");
    expect(insight.changePct).toBeNull();
  });

  it("picks the largest real movement and labels its sense", () => {
    const insight = deriveKeyInsight([
      metric({ id: "focus", label: "Focus hours", higherIsBetter: true, comparison: { changePct: 8, direction: "up" } }),
      metric({ id: "sugar", label: "Sugar", higherIsBetter: false, comparison: { changePct: 40, direction: "up" } }),
    ]);
    expect(insight.metricLabel).toBe("Sugar");
    expect(insight.positive).toBe(false);
    expect(insight.headline).toContain("slipped");
  });
});

describe("deriveAttention / derivePositive", () => {
  const good = metric({ id: "focus", label: "Focus", higherIsBetter: true, comparison: { changePct: 20, direction: "up" } });
  const bad = metric({ id: "debt", label: "Debt", higherIsBetter: false, comparison: { changePct: 15, direction: "up" } });

  it("routes improving metrics to positive and declining ones to attention", () => {
    expect(derivePositive([good, bad], null).map((s) => s.id)).toEqual(["kpi-focus"]);
    expect(deriveAttention([good, bad], null).map((s) => s.id)).toEqual(["kpi-debt"]);
  });

  it("flags a Life Score drop and a Life Score gain respectively", () => {
    expect(
      deriveAttention([], { current: 60, previous: 70, changeAbs: -10, changePct: -14, direction: "down", sampleSize: 4 }),
    ).toHaveLength(1);
    expect(
      derivePositive([], { current: 75, previous: 70, changeAbs: 5, changePct: 7, direction: "up", sampleSize: 4 }),
    ).toHaveLength(1);
  });

  it("ignores tiny movements below the meaningful threshold", () => {
    const tiny = metric({ id: "x", comparison: { changePct: 2, direction: "up" } });
    expect(derivePositive([tiny], null)).toHaveLength(0);
    expect(deriveAttention([tiny], null)).toHaveLength(0);
  });
});
