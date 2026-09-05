import { describe, expect, it } from "vitest";
import { computeLifeScore } from "./life-score";
import type { Kpi } from "@/features/kpis";

function makeKpi(over: Partial<Kpi> & Pick<Kpi, "id">): Kpi {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title: over.title ?? "KPI",
    description: "",
    category: "",
    pillarIds: [],
    unit: "",
    direction: over.direction ?? "higher-is-better",
    targetValue: over.targetValue ?? null,
    weight: over.weight ?? 1,
    goalId: null,
    notes: "",
  };
}

describe("computeLifeScore", () => {
  it("returns a null score with no scorable KPIs", () => {
    expect(computeLifeScore([], new Map())).toEqual({ score: null, factors: [] });
  });

  it("excludes KPIs with no target or no entry, rather than counting them as 0", () => {
    const kpis = [
      makeKpi({ id: "a", title: "Sleep", targetValue: 8 }), // no entry
      makeKpi({ id: "b", title: "Savings", targetValue: null }), // has an entry, no target
      makeKpi({ id: "c", title: "Reading", targetValue: 10 }),
    ];
    const latestValueByKpi = new Map([
      ["b", 500],
      ["c", 5],
    ]);

    const result = computeLifeScore(kpis, latestValueByKpi);
    expect(result.factors).toHaveLength(1);
    expect(result.factors[0]).toMatchObject({ kpiId: "c", attainment: 50 });
    expect(result.score).toBe(50);
  });

  it("weights each KPI's attainment by its configurable weight", () => {
    const kpis = [
      makeKpi({ id: "a", targetValue: 10, weight: 1 }), // attainment 100
      makeKpi({ id: "b", targetValue: 10, weight: 3 }), // attainment 0
    ];
    const latestValueByKpi = new Map([
      ["a", 10],
      ["b", 0],
    ]);

    // weighted average: (100*1 + 0*3) / (1+3) = 25
    expect(computeLifeScore(kpis, latestValueByKpi).score).toBe(25);
  });
});
