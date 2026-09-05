import { describe, expect, it } from "vitest";
import { latestEntry, summarizeKpis } from "./kpi-stats";
import type { Kpi, KpiEntry } from "./schema";

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
    title: "KPI",
    description: "",
    category: "",
    pillarIds: [],
    unit: "",
    direction: over.direction ?? "higher-is-better",
    targetValue: over.targetValue ?? null,
    weight: over.weight ?? 3,
    goalId: null,
    notes: "",
  };
}

function makeEntry(over: Partial<KpiEntry> & Pick<KpiEntry, "id" | "kpiId">): KpiEntry {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    kpiId: over.kpiId,
    date: over.date ?? "2026-09-01",
    value: over.value ?? 0,
    note: "",
  };
}

describe("latestEntry", () => {
  it("returns null for an empty list", () => {
    expect(latestEntry([])).toBeNull();
  });

  it("picks the most recent entry by date regardless of array order", () => {
    const entries = [
      makeEntry({ id: "a", kpiId: "k1", date: "2026-09-01", value: 1 }),
      makeEntry({ id: "b", kpiId: "k1", date: "2026-09-10", value: 3 }),
      makeEntry({ id: "c", kpiId: "k1", date: "2026-09-05", value: 2 }),
    ];
    expect(latestEntry(entries)?.id).toBe("b");
  });
});

describe("summarizeKpis", () => {
  it("returns zeros/null average for no KPIs", () => {
    expect(summarizeKpis([], new Map())).toEqual({ total: 0, withEntries: 0, avgAttainment: null });
  });

  it("counts KPIs with entries and averages attainment across scorable KPIs", () => {
    const kpis = [
      makeKpi({ id: "a", targetValue: 8, direction: "higher-is-better" }),
      makeKpi({ id: "b", targetValue: null }),
      makeKpi({ id: "c", targetValue: 10, direction: "higher-is-better" }),
    ];
    const entriesByKpi = new Map<string, KpiEntry[]>([
      ["a", [makeEntry({ id: "e1", kpiId: "a", date: "2026-09-05", value: 4 })]],
      ["b", [makeEntry({ id: "e2", kpiId: "b", date: "2026-09-05", value: 1 })]],
    ]);

    const stats = summarizeKpis(kpis, entriesByKpi);
    expect(stats.total).toBe(3);
    expect(stats.withEntries).toBe(2);
    // only "a" is scorable (target set + has an entry): 4/8 = 50%
    expect(stats.avgAttainment).toBe(50);
  });
});
