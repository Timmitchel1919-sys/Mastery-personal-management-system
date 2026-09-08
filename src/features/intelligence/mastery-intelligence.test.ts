import { describe, expect, it } from "vitest";
import type { MetricSummary, PeriodComparison } from "@/features/analytics/analytics-insights";
import { buildIntelligence } from "./mastery-intelligence";

function comparison(over: Partial<PeriodComparison> = {}): PeriodComparison {
  return {
    current: 12,
    previous: 10,
    changeAbs: 2,
    changePct: 20,
    direction: "up",
    sampleSize: 6,
    ...over,
  };
}

function metric(over: Partial<MetricSummary> & { id: string }): MetricSummary {
  return {
    id: over.id,
    label: over.label ?? over.id,
    unit: over.unit ?? "",
    higherIsBetter: over.higherIsBetter ?? true,
    comparison: over.comparison ?? comparison(),
  };
}

const flat: PeriodComparison = {
  current: null,
  previous: null,
  changeAbs: null,
  changePct: null,
  direction: "flat",
  sampleSize: 0,
};

describe("buildIntelligence", () => {
  it("returns nothing when there is no data at all", () => {
    expect(
      buildIntelligence({ metrics: [], lifeScore: flat, periodLabel: "30 days", hasAnyData: false }),
    ).toEqual([]);
  });

  it("returns nothing when movements are below the meaningful threshold", () => {
    const tiny = metric({ id: "sleep", comparison: comparison({ changePct: 2 }) });
    expect(
      buildIntelligence({ metrics: [tiny], lifeScore: flat, periodLabel: "30 days", hasAnyData: true }),
    ).toEqual([]);
  });

  it("splits a metric read into fact / interpretation / recommendation", () => {
    const [insight] = buildIntelligence({
      metrics: [metric({ id: "focus", label: "Focus hours", unit: "h", higherIsBetter: true })],
      lifeScore: flat,
      periodLabel: "30 days",
      hasAnyData: true,
    });
    expect(insight?.kind).toBe("positive");
    expect(insight?.fact).toContain("Focus hours rose 20%");
    expect(insight?.interpretation).toMatch(/your data suggests/i);
    expect(insight?.recommendation).toMatch(/consider/i);
    expect(insight?.action).toEqual({ label: "Open KPIs", href: "/analytics/kpis" });
  });

  it("treats a rising lower-is-better metric as an attention item", () => {
    const [insight] = buildIntelligence({
      metrics: [metric({ id: "debt", label: "Debt", higherIsBetter: false })],
      lifeScore: flat,
      periodLabel: "30 days",
      hasAnyData: true,
    });
    expect(insight?.kind).toBe("attention");
    expect(insight?.title).toContain("slipping");
  });

  it("grades the signal by sample size and orders attention before positive", () => {
    const strongBad = metric({
      id: "debt",
      label: "Debt",
      higherIsBetter: false,
      comparison: comparison({ sampleSize: 9 }),
    });
    const weakGood = metric({
      id: "reading",
      label: "Reading",
      comparison: comparison({ sampleSize: 3 }),
    });
    const result = buildIntelligence({
      metrics: [weakGood, strongBad],
      lifeScore: flat,
      periodLabel: "30 days",
      hasAnyData: true,
    });
    expect(result.map((i) => i.kind)).toEqual(["attention", "positive"]);
    expect(result[0]?.signal).toBe("strong");
    expect(result[1]?.signal).toBe("limited");
  });

  it("adds a Life Score insight when the score moved at least 3 points", () => {
    const result = buildIntelligence({
      metrics: [],
      lifeScore: comparison({ current: 62, previous: 70, changeAbs: -8, changePct: -11, direction: "down", sampleSize: 4 }),
      periodLabel: "30 days",
      hasAnyData: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("life-score");
    expect(result[0]?.kind).toBe("attention");
    expect(result[0]?.signal).toBe("moderate");
  });
});
