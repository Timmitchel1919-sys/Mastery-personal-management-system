import { describe, expect, it } from "vitest";
import type { GoalHealth, Scenario } from "@/features/strategy";
import type { ProjectHealthEntry, PlanHealthEntry } from "@/features/adaptation";
import type { PredictiveSignal } from "@/features/predictions";
import type { HistoricalCalibration } from "@/features/twin";
import {
  buildEarlyWarnings,
  buildForecasts,
  buildFutureTimeline,
  refreshForecastStatus,
  summarizeCalibration,
  type CalibrationEntry,
  type ForesightInput,
} from "./foresight-model";

const NOW = "2026-09-11T09:00:00.000Z";
const iso = (daysFromNow: number) => new Date(Date.parse(NOW) + daysFromNow * 86_400_000).toISOString();

function signal(over: Partial<PredictiveSignal> & { id: string }): PredictiveSignal {
  return {
    id: over.id,
    category: over.category ?? "deadline-risk",
    urgency: over.urgency ?? "important",
    prediction: over.prediction ?? "prediction text",
    evidence: over.evidence ?? ["evidence"],
    confidence: over.confidence ?? "moderate",
    recommendation: over.recommendation,
    action: over.action,
    generatedAt: NOW,
  };
}

function scenario(over: Partial<Scenario> & { kind: Scenario["kind"] }): Scenario {
  return {
    kind: over.kind,
    title: over.title ?? "Scenario",
    description: over.description ?? "description",
    implications: over.implications ?? ["implication"],
    horizon: over.horizon ?? "short",
  };
}

function goalHealth(over: Partial<GoalHealth> & { goalId: string }): GoalHealth {
  return {
    goalId: over.goalId,
    goalTitle: over.goalTitle ?? over.goalId,
    state: over.state ?? "at-risk",
    reasons: over.reasons ?? ["reason"],
  };
}

function projectHealth(over: Partial<ProjectHealthEntry> & { projectId: string }): ProjectHealthEntry {
  return {
    projectId: over.projectId,
    state: over.state ?? "delayed",
    taskCount: over.taskCount ?? 5,
    reasons: over.reasons ?? ["2 overdue"],
  };
}

function planHealth(over: Partial<PlanHealthEntry> & { planId: string }): PlanHealthEntry {
  return {
    planId: over.planId,
    planTitle: over.planTitle ?? over.planId,
    state: over.state ?? "overloaded",
    reasons: over.reasons ?? ["2 high-priority goals"],
  };
}

function baseInput(over: Partial<ForesightInput> = {}): ForesightInput {
  return {
    nowIso: NOW,
    predictions: over.predictions ?? { enabled: true, signals: [] },
    scenarios: over.scenarios ?? [],
    goalHealth: over.goalHealth ?? [],
    projectHealth: over.projectHealth ?? [],
    planHealth: over.planHealth ?? [],
    capacity: over.capacity ?? null,
    calibration: over.calibration ?? null,
    hasData: over.hasData ?? true,
  };
}

describe("buildForecasts", () => {
  it("maps a J prediction signal into a horizon-bucketed, kind-labelled forecast", () => {
    const forecasts = buildForecasts(
      baseInput({ predictions: { enabled: true, signals: [signal({ id: "s1", category: "deadline-risk", urgency: "critical" })] } }),
    );
    expect(forecasts[0]?.type).toBe("DEADLINE_RISK");
    expect(forecasts[0]?.kind).toBe("PREDICTION");
    expect(forecasts[0]?.horizon).toBe("next-7-days");
  });

  it("ignores predictions the user disabled", () => {
    expect(buildForecasts(baseInput({ predictions: { enabled: false, signals: [signal({ id: "s1" })] } }))).toHaveLength(0);
  });

  it("maps a strategy scenario to a PROJECTION, never a PREDICTION", () => {
    const forecasts = buildForecasts(baseInput({ scenarios: [scenario({ kind: "accelerate", horizon: "short" })] }));
    expect(forecasts[0]?.kind).toBe("PROJECTION");
    expect(forecasts[0]?.horizon).toBe("next-7-days");
  });

  it("gives limited-data scenarios low confidence, never false precision", () => {
    const forecasts = buildForecasts(baseInput({ scenarios: [scenario({ kind: "current-course", horizon: "limited-data" })] }));
    expect(forecasts[0]?.confidence).toBe("low");
  });

  it("only forecasts at-risk/stalled goals, not on-track ones", () => {
    const forecasts = buildForecasts(
      baseInput({ goalHealth: [goalHealth({ goalId: "g1", state: "on-track" }), goalHealth({ goalId: "g2", state: "stalled" })] }),
    );
    expect(forecasts).toHaveLength(1);
    expect(forecasts[0]?.target.id).toBe("g2");
  });

  it("only forecasts overloaded plans, not healthy ones", () => {
    const forecasts = buildForecasts(
      baseInput({ planHealth: [planHealth({ planId: "p1", state: "healthy" }), planHealth({ planId: "p2", state: "overloaded" })] }),
    );
    expect(forecasts).toHaveLength(1);
    expect(forecasts[0]?.type).toBe("WORKLOAD");
  });

  it("only forecasts delayed/blocked/at-risk projects, not on-track ones", () => {
    const forecasts = buildForecasts(
      baseInput({ projectHealth: [projectHealth({ projectId: "p1", state: "on-track" }), projectHealth({ projectId: "p2", state: "blocked" })] }),
    );
    expect(forecasts).toHaveLength(1);
    expect(forecasts[0]?.impact).toBe("high");
  });

  it("forecasts capacity risk only when actually over-committed, with a separate recommendation", () => {
    const notOver = buildForecasts(baseInput({ capacity: { overCommitted: false, plannedFocusHours: 10, availableFocusHoursPerWeek: 20 } }));
    expect(notOver.find((f) => f.type === "CAPACITY_RISK")).toBeUndefined();

    const over = buildForecasts(baseInput({ capacity: { overCommitted: true, plannedFocusHours: 30, availableFocusHoursPerWeek: 20 } }));
    const forecast = over.find((f) => f.type === "CAPACITY_RISK");
    expect(forecast?.recommendation).toMatch(/reprioritize/i);
    expect(forecast?.statement).not.toMatch(/reprioritize/i); // statement and recommendation stay separate
  });

  it("only projects a task-completion bias with a meaningful overrun factor", () => {
    const mild: HistoricalCalibration = { estimateOverrunFactor: 1.05, sampleSize: 10 };
    expect(buildForecasts(baseInput({ calibration: mild }))).toHaveLength(0);

    const strong: HistoricalCalibration = { estimateOverrunFactor: 1.6, sampleSize: 10 };
    const forecasts = buildForecasts(baseInput({ calibration: strong }));
    expect(forecasts[0]?.kind).toBe("PROJECTION");
  });

  it("deduplicates identical forecasts across sources", () => {
    const forecasts = buildForecasts(
      baseInput({
        goalHealth: [goalHealth({ goalId: "g1", goalTitle: "Same", state: "at-risk", reasons: ["r"] }), goalHealth({ goalId: "g1", goalTitle: "Same", state: "at-risk", reasons: ["r"] })],
      }),
    );
    expect(forecasts).toHaveLength(1);
  });

  it("sorts by impact first, then horizon urgency, then confidence", () => {
    const forecasts = buildForecasts(
      baseInput({
        goalHealth: [goalHealth({ goalId: "low", state: "at-risk", reasons: [] })],
        capacity: { overCommitted: true, plannedFocusHours: 30, availableFocusHoursPerWeek: 20 },
      }),
    );
    expect(forecasts[0]?.type).toBe("CAPACITY_RISK"); // impact "high" beats goal's "medium"
  });
});

describe("refreshForecastStatus", () => {
  const forecasts = buildForecasts(baseInput({ goalHealth: [goalHealth({ goalId: "g1", state: "stalled" })] }));

  it("marks a forecast stale once its underlying signal no longer appears", () => {
    const refreshed = refreshForecastStatus(forecasts, new Set(), NOW);
    expect(refreshed[0]?.status).toBe("stale");
  });

  it("keeps a forecast active while its signal still holds and it has not expired", () => {
    const key = `${forecasts[0]!.type}::${forecasts[0]!.statement}`;
    const refreshed = refreshForecastStatus(forecasts, new Set([key]), NOW);
    expect(refreshed[0]?.status).toBe("active");
  });

  it("marks a forecast expired once its horizon has passed, even if the signal persists", () => {
    const key = `${forecasts[0]!.type}::${forecasts[0]!.statement}`;
    const refreshed = refreshForecastStatus(forecasts, new Set([key]), iso(400));
    expect(refreshed[0]?.status).toBe("expired");
  });
});

describe("buildEarlyWarnings", () => {
  it("only warns on meaningful impact + confidence, never every forecast", () => {
    const forecasts = buildForecasts(
      baseInput({ predictions: { enabled: true, signals: [signal({ id: "s1", category: "deadline-risk", urgency: "information", confidence: "limited" })] } }),
    );
    expect(buildEarlyWarnings(forecasts)).toHaveLength(0);
  });

  it("caps warnings and gives each an actionable target", () => {
    const forecasts = buildForecasts(
      baseInput({ capacity: { overCommitted: true, plannedFocusHours: 30, availableFocusHoursPerWeek: 20 } }),
    );
    const [warning] = buildEarlyWarnings(forecasts);
    expect(warning?.kind).toBe("CAPACITY_OVERLOAD");
    expect(warning?.action.href).toBe("/simulation");
  });

  it("excludes stale/expired forecasts from warnings", () => {
    const forecasts = buildForecasts(baseInput({ capacity: { overCommitted: true, plannedFocusHours: 30, availableFocusHoursPerWeek: 20 } })).map(
      (f) => ({ ...f, status: "stale" as const }),
    );
    expect(buildEarlyWarnings(forecasts)).toHaveLength(0);
  });
});

describe("buildFutureTimeline", () => {
  it("keeps ACTUAL and PREDICTED/PROJECTED entries semantically distinct", () => {
    const forecasts = buildForecasts(baseInput({ scenarios: [scenario({ kind: "accelerate", horizon: "medium" })] }));
    const timeline = buildFutureTimeline(forecasts, [{ id: "e1", label: "Deadline", date: iso(5) }], NOW);
    expect(timeline.find((entry) => entry.kind === "ACTUAL")?.date).toBe(iso(5));
    expect(timeline.find((entry) => entry.kind === "PROJECTED")?.date).toBeNull();
  });

  it("buckets actual events by days-out into the right horizon", () => {
    const timeline = buildFutureTimeline([], [{ id: "e1", label: "Soon", date: iso(3) }, { id: "e2", label: "Later", date: iso(60) }], NOW);
    expect(timeline.find((e) => e.id === "tl:actual:e1")?.bucket).toBe("next-7-days");
    expect(timeline.find((e) => e.id === "tl:actual:e2")?.bucket).toBe("next-90-days");
  });

  it("orders entries from today outward", () => {
    const timeline = buildFutureTimeline([], [{ id: "far", label: "far", date: iso(100) }, { id: "near", label: "near", date: iso(1) }], NOW);
    expect(timeline[0]?.id).toBe("tl:actual:near");
  });
});

describe("summarizeCalibration", () => {
  function entry(over: Partial<CalibrationEntry> & { id: string }): CalibrationEntry {
    return {
      id: over.id,
      forecastId: over.forecastId ?? over.id,
      forecastType: over.forecastType ?? "DEADLINE_RISK",
      statement: over.statement ?? "x",
      predictedAt: NOW,
      verdict: over.verdict ?? "UNRESOLVED",
      note: over.note ?? null,
      evaluatedAt: over.evaluatedAt ?? null,
    };
  }

  it("computes accuracy only from evaluated entries, never fabricating for UNRESOLVED ones", () => {
    const summary = summarizeCalibration([
      entry({ id: "1", verdict: "CORRECT" }),
      entry({ id: "2", verdict: "INCORRECT" }),
      entry({ id: "3", verdict: "UNRESOLVED" }),
    ]);
    expect(summary.total).toBe(3);
    expect(summary.evaluated).toBe(2);
    expect(summary.accuracyRate).toBe(0.5);
  });

  it("returns null accuracy when nothing has been evaluated — never a fabricated number", () => {
    expect(summarizeCalibration([entry({ id: "1", verdict: "UNRESOLVED" })]).accuracyRate).toBeNull();
  });

  it("weighs partially-correct verdicts at half credit", () => {
    const summary = summarizeCalibration([entry({ id: "1", verdict: "PARTIALLY_CORRECT" })]);
    expect(summary.accuracyRate).toBe(0.5);
  });
});
