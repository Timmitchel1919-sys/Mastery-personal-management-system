import { describe, expect, it } from "vitest";
import type { ActionRecord } from "@/features/actions/action-model";
import type { MetricSummary, PeriodComparison } from "@/features/analytics/analytics-insights";
import {
  acceptanceFromHistory,
  buildPersonalPatterns,
  classifyTrend,
  dataSufficiency,
  detectSignificantChange,
} from "./personal-signals";

function comparison(over: Partial<PeriodComparison> = {}): PeriodComparison {
  return {
    current: 12,
    previous: 10,
    changeAbs: 2,
    changePct: 20,
    direction: "up",
    sampleSize: 15,
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

function record(over: Partial<ActionRecord> & { id: string }): ActionRecord {
  return {
    id: over.id,
    kind: "reschedule-task",
    title: over.title ?? over.id,
    source: over.source ?? "ai",
    status: over.status ?? "completed",
    at: "2026-03-01T00:00:00.000Z",
    ...(over.error ? { error: over.error } : {}),
  };
}

describe("dataSufficiency", () => {
  it("bands sample size into documented qualitative states", () => {
    expect(dataSufficiency(0)).toBe("insufficient");
    expect(dataSufficiency(3)).toBe("insufficient");
    expect(dataSufficiency(4)).toBe("limited");
    expect(dataSufficiency(12)).toBe("emerging");
    expect(dataSufficiency(30)).toBe("strong");
    expect(dataSufficiency(200)).toBe("strong");
  });
});

describe("classifyTrend", () => {
  it("needs at least limited data and a real move", () => {
    expect(classifyTrend(40, 2)).toBe("insufficient");
    expect(classifyTrend(null, 40)).toBe("insufficient");
    expect(classifyTrend(3, 40)).toBe("stable");
  });
  it("only says improving/declining once past the emerging threshold", () => {
    expect(classifyTrend(30, 6)).toBe("emerging");
    expect(classifyTrend(30, 20)).toBe("improving");
    expect(classifyTrend(-30, 20)).toBe("declining");
  });
});

describe("acceptanceFromHistory", () => {
  it("counts applied vs dismissed AI suggestions, ignoring failures and non-AI", () => {
    const signal = acceptanceFromHistory([
      record({ id: "1", status: "completed" }),
      record({ id: "2", status: "completed" }),
      record({ id: "3", status: "cancelled" }),
      record({ id: "4", status: "failed" }),
      record({ id: "5", status: "completed", source: "user" }),
    ]);
    expect(signal.applied).toBe(2);
    expect(signal.dismissed).toBe(1);
    expect(signal.total).toBe(3);
    expect(signal.rate).toBeCloseTo(2 / 3);
  });

  it("has a null rate when there is nothing to divide", () => {
    expect(acceptanceFromHistory([]).rate).toBeNull();
  });
});

describe("buildPersonalPatterns", () => {
  const base = { lifeScore: comparison({ changePct: null }), periodLabel: "30 days" };

  it("returns nothing without enough of any signal", () => {
    expect(
      buildPersonalPatterns({
        ...base,
        metrics: [metric({ id: "m", comparison: comparison({ sampleSize: 2 }) })],
        history: [],
      }),
    ).toEqual([]);
  });

  it("surfaces an acceptance pattern once there are enough reviewed suggestions", () => {
    const patterns = buildPersonalPatterns({
      ...base,
      metrics: [],
      history: [
        record({ id: "1" }),
        record({ id: "2" }),
        record({ id: "3" }),
        record({ id: "4", status: "cancelled" }),
      ],
    });
    const acceptance = patterns.find((p) => p.id === "acceptance-rate");
    expect(acceptance).toBeDefined();
    expect(acceptance?.observed).toContain("3 of the last 4");
    expect(acceptance?.sufficiency).toBe("limited");
  });

  it("surfaces a KPI trend and keeps observed / interpretation / recommendation distinct", () => {
    const patterns = buildPersonalPatterns({
      ...base,
      metrics: [metric({ id: "focus", label: "Focus hours", comparison: comparison({ changePct: 22, sampleSize: 18 }) })],
      history: [],
    });
    const trend = patterns.find((p) => p.id === "metric-trend-focus");
    expect(trend?.trend).toBe("improving");
    expect(trend?.observed).toContain("Focus hours moved +22%");
    expect(trend?.interpretation).toMatch(/your data shows/i);
    expect(trend?.recommendation).toMatch(/consider/i);
  });
});

describe("detectSignificantChange", () => {
  it("only fires on a large, well-sampled move and never states a cause", () => {
    expect(detectSignificantChange([metric({ id: "a", comparison: comparison({ changePct: 10, sampleSize: 40 }) })], "30 days")).toBeNull();
    const change = detectSignificantChange(
      [metric({ id: "focus", label: "Focus", comparison: comparison({ changePct: -42, sampleSize: 20 }) })],
      "30 days",
    );
    expect(change?.observed).toBe("Your Focus fell 42% over the 30 days.");
    expect(change?.observed).not.toMatch(/burn|tired|lazy|discipline/i);
  });
});
