import { describe, expect, it } from "vitest";
import type { DecisionRecord } from "@/features/decisions/schema";
import type { Goal } from "@/features/goals/schema";
import type { Task } from "@/features/tasks/schema";
import {
  buildApplyPreview,
  buildBaseline,
  calibrateFromHistory,
  compareScenarios,
  defaultAssumptions,
  runSimulation,
  type Scenario,
  type ScenarioChange,
  type TwinInput,
} from "./digital-twin";

const NOW = "2026-09-10T09:00:00.000Z";
const ymd = (daysFromNow: number) => new Date(Date.parse(NOW) + daysFromNow * 86_400_000).toISOString().slice(0, 10);

function goal(over: Partial<Goal> & { id: string }): Goal {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: NOW,
    updatedAt: NOW,
    createdBy: "u",
    updatedBy: "u",
    archivedAt: null,
    title: over.title ?? over.id,
    description: "",
    pillarIds: ["personal"],
    parentPlanId: over.parentPlanId ?? null,
    startDate: null,
    targetDate: over.targetDate ?? null,
    goalStatus: over.goalStatus ?? "in-progress",
    priority: over.priority ?? "medium",
    progress: over.progress ?? 20,
    measurementType: "percent",
    targetValue: null,
    currentValue: null,
    unit: "",
    reviewFrequency: "weekly",
  } as Goal;
}

function task(over: Partial<Task> & { id: string }): Task {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: NOW,
    updatedAt: NOW,
    createdBy: "u",
    updatedBy: "u",
    archivedAt: null,
    title: over.title ?? over.id,
    description: "",
    taskStatus: over.taskStatus ?? "todo",
    priority: over.priority ?? "medium",
    startDate: null,
    dueDate: over.dueDate ?? null,
    pillarIds: ["personal"],
    goalId: over.goalId ?? null,
    projectId: null,
    milestoneId: null,
    parentTaskId: null,
    recurrence: null,
    estimatedMinutes: over.estimatedMinutes ?? 0,
    actualMinutes: over.actualMinutes ?? 0,
    energyRequirement: "medium",
    tags: [],
    context: "",
    notes: "",
    completedAt: null,
    resolutionReason: "",
  } as Task;
}

function decision(over: Partial<DecisionRecord> & { id: string }): DecisionRecord {
  return {
    id: over.id,
    title: over.id,
    description: "",
    status: over.status ?? "ANALYZING",
    createdAt: NOW,
    updatedAt: NOW,
    decisionDate: ymd(0),
    domain: "plan",
    importance: "medium",
    urgency: "medium",
    context: "",
    desiredOutcome: "",
    userPriority: "",
    constraints: [],
    assumptions: [],
    relatedGoals: [],
    relatedPlans: [],
    relatedPredictions: [],
    relatedRecommendations: [],
    selectedOptionId: null,
    criteria: [],
    options: [],
    tradeOffs: [],
    risks: [],
    scenarios: [],
    evidence: [],
  } as DecisionRecord;
}

function input(over: Partial<TwinInput> = {}): TwinInput {
  return {
    nowIso: NOW,
    goals: over.goals ?? [],
    plans: over.plans ?? [],
    tasks: over.tasks ?? [],
    predictions: over.predictions ?? { enabled: true, status: "ready", signals: [] },
    decisions: over.decisions ?? [],
    ...(over.availableFocusHoursPerWeek !== undefined
      ? { availableFocusHoursPerWeek: over.availableFocusHoursPerWeek }
      : {}),
  };
}

function change(over: Partial<ScenarioChange> & { id: string; op: ScenarioChange["op"] }): ScenarioChange {
  return {
    id: over.id,
    op: over.op,
    targetKind: over.targetKind ?? "project",
    ...(over.targetId ? { targetId: over.targetId } : {}),
    targetLabel: over.targetLabel ?? "Thing",
    params: over.params ?? {},
  };
}

function scenario(over: Partial<Scenario> & { id: string }, baseline = buildBaseline(input())): Scenario {
  return {
    id: over.id,
    name: over.name ?? over.id,
    horizon: over.horizon ?? "1m",
    changes: over.changes ?? [],
    assumptions: over.assumptions ?? defaultAssumptions(baseline),
    status: over.status ?? "DRAFT",
    version: over.version ?? 1,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

describe("buildBaseline", () => {
  it("represents operational state and tags every metric fact / estimate / assumption", () => {
    const baseline = buildBaseline(
      input({
        goals: [goal({ id: "g1" }), goal({ id: "g2", targetDate: ymd(20) })],
        tasks: [
          task({ id: "t1", estimatedMinutes: 300, dueDate: ymd(5) }),
          task({ id: "t2", taskStatus: "blocked", estimatedMinutes: 120 }),
        ],
        decisions: [decision({ id: "d1" })],
      }),
    );
    expect(baseline.activeGoals).toBe(2);
    expect(baseline.blockedItems).toBe(1);
    expect(baseline.upcomingDeadlines).toBe(2); // one task due, one goal target
    expect(baseline.openDecisions).toBe(1);
    expect(baseline.capacity.plannedFocusHours).toBe(7);
    const kinds = Object.fromEntries(baseline.metrics.map((m) => [m.key, m.kind]));
    expect(kinds.activeGoals).toBe("fact");
    expect(kinds.availableFocusHours).toBe("assumption");
    expect(kinds.scheduledFocusHours).toBe("estimate");
  });

  it("flags over-commitment against the configured availability assumption", () => {
    const baseline = buildBaseline(
      input({ tasks: [task({ id: "t1", estimatedMinutes: 60 * 30 })], availableFocusHoursPerWeek: 20 }),
    );
    expect(baseline.capacity.overCommitted).toBe(true);
    expect(baseline.capacity.unallocatedFocusHours).toBeLessThan(0);
  });

  it("reports hasData=false when there is nothing to model", () => {
    expect(buildBaseline(input()).hasData).toBe(false);
  });
});

describe("calibrateFromHistory", () => {
  it("needs at least 3 completed tasks with estimates and actuals", () => {
    expect(calibrateFromHistory([task({ id: "t1", taskStatus: "done", estimatedMinutes: 60, actualMinutes: 90 })])).toEqual(
      { estimateOverrunFactor: null, sampleSize: 1 },
    );
  });

  it("computes the actual-to-estimate factor without concluding why", () => {
    const done = [
      task({ id: "t1", taskStatus: "done", estimatedMinutes: 100, actualMinutes: 150 }),
      task({ id: "t2", taskStatus: "done", estimatedMinutes: 100, actualMinutes: 150 }),
      task({ id: "t3", taskStatus: "done", estimatedMinutes: 100, actualMinutes: 150 }),
    ];
    expect(calibrateFromHistory(done)).toEqual({ estimateOverrunFactor: 1.5, sampleSize: 3 });
  });
});

describe("runSimulation", () => {
  const baseline = buildBaseline(
    input({
      goals: [goal({ id: "g1", progress: 20 }), goal({ id: "g2", progress: 40 })],
      tasks: [task({ id: "t1", estimatedMinutes: 480, dueDate: ymd(5) })],
      availableFocusHoursPerWeek: 20,
    }),
  );

  it("keeps baseline as-is and tags every projected metric 'projection'", () => {
    const result = runSimulation(baseline, scenario({ id: "s1", changes: [change({ id: "c1", op: "ADD", params: { hours: 4 } })] }, baseline));
    expect(result.baseline.find((m) => m.key === "plannedFocusHours")?.kind).toBe("estimate");
    expect(result.projected.every((m) => m.kind === "projection")).toBe(true);
    expect(result.projected.find((m) => m.key === "plannedFocusHours")?.value).toBe(12); // 8 + 4
  });

  it("returns the full simulation output contract", () => {
    const result = runSimulation(baseline, scenario({ id: "s1", changes: [change({ id: "c1", op: "ACCELERATE", targetKind: "goal", params: { hours: 6 } })] }, baseline));
    expect(result).toMatchObject({
      scenarioId: "s1",
      changes: expect.any(Array),
      affectedAreas: expect.arrayContaining(["GOAL"]),
      outcomes: expect.any(Array),
      risks: expect.any(Array),
      tradeOffs: expect.any(Array),
      assumptions: expect.any(Array),
      limitations: expect.any(Array),
    });
    expect(["high", "medium", "low", "insufficient-data"]).toContain(result.confidence);
  });

  it("projects goal progress upward when focus is added, bounded to 100", () => {
    const result = runSimulation(
      baseline,
      scenario({ id: "s1", horizon: "3m", changes: [change({ id: "c1", op: "ACCELERATE", targetKind: "goal", params: { hours: 8 } })] }, baseline),
    );
    const projected = result.projected.find((m) => m.key === "avgGoalProgress")?.value ?? 0;
    expect(projected).toBeGreaterThan(30);
    expect(projected).toBeLessThanOrEqual(100);
    expect(result.outcomes.join(" ")).toMatch(/projection/i);
  });

  it("eases deadline pressure when a scenario defers", () => {
    const result = runSimulation(baseline, scenario({ id: "s1", changes: [change({ id: "c1", op: "DEFER", targetKind: "deadline", params: { days: 14 } })] }, baseline));
    expect(result.tradeOffs.join(" ")).toMatch(/still lands later/i);
    expect(result.projected.find((m) => m.key === "upcomingDeadlines")?.value).toBeLessThanOrEqual(baseline.upcomingDeadlines);
  });

  it("flags over-commitment as a risk", () => {
    const result = runSimulation(baseline, scenario({ id: "s1", changes: [change({ id: "c1", op: "ADD", params: { hours: 40 } })] }, baseline));
    expect(result.risks.join(" ")).toMatch(/exceeds configured availability/i);
  });

  it("returns insufficient-data confidence when the baseline is empty or no changes", () => {
    const empty = buildBaseline(input());
    const result = runSimulation(empty, scenario({ id: "s1" }, empty));
    expect(result.confidence).toBe("insufficient-data");
    expect(result.limitations).toContain("Insufficient data for reliable simulation.");
  });

  it("uses a provided historical calibration to lift confidence; an explicit assumption still wins", () => {
    const result = runSimulation(
      baseline,
      scenario({ id: "s1", changes: [change({ id: "c1", op: "ADD", params: { hours: 3 } })] }, baseline),
      { estimateOverrunFactor: 1.4, sampleSize: 10 },
    );
    expect(result.confidence).toBe("medium");
    // the scenario's default assumption factor is 1, and explicit assumptions win
    expect(result.projected.find((m) => m.key === "plannedFocusHours")?.value).toBeCloseTo(8 + 3, 1);
  });

  it("seeds the estimate-to-actual assumption from a historical calibration", () => {
    const calibrated = defaultAssumptions(baseline, { estimateOverrunFactor: 1.4, sampleSize: 10 });
    const overrun = calibrated.find((a) => a.key === "estimateOverrunFactor");
    expect(overrun?.value).toBe(1.4);
    expect(overrun?.kind).toBe("estimate");
    const scn = scenario({ id: "s1", changes: [change({ id: "c1", op: "ADD", params: { hours: 3 } })], assumptions: calibrated }, baseline);
    const result = runSimulation(baseline, scn);
    expect(result.projected.find((m) => m.key === "plannedFocusHours")?.value).toBeCloseTo(8 * 1.4 + 3, 1);
  });

  it("respects an edited assumption over the calibration default", () => {
    const scn = scenario({ id: "s1", changes: [change({ id: "c1", op: "ADD", params: { hours: 2 } })] }, baseline);
    scn.assumptions = scn.assumptions.map((a) =>
      a.key === "availableFocusHoursPerWeek" ? { ...a, value: 5 } : a,
    );
    const result = runSimulation(baseline, scn);
    expect(result.risks.join(" ")).toMatch(/exceeds configured availability \(5h\/wk\)/i);
  });
});

describe("compareScenarios", () => {
  it("builds a comparison table with per-scenario deltas", () => {
    const baseline = buildBaseline(input({ goals: [goal({ id: "g1" })], tasks: [task({ id: "t1", estimatedMinutes: 300 })] }));
    const a = runSimulation(baseline, scenario({ id: "a", name: "Add", changes: [change({ id: "c", op: "ADD", params: { hours: 4 } })] }, baseline));
    const b = runSimulation(baseline, scenario({ id: "b", name: "Pause", changes: [change({ id: "c", op: "PAUSE", params: { hours: 3 } })] }, baseline));
    const rows = compareScenarios([a, b]);
    const planned = rows.find((r) => r.key === "plannedFocusHours");
    expect(planned?.scenarios.map((s) => s.scenarioName)).toEqual(["Add", "Pause"]);
    expect(planned?.scenarios[0]?.delta).toBeGreaterThan(0);
    expect(planned?.scenarios[1]?.delta).toBeLessThan(0);
  });

  it("returns an empty table when there are no results", () => {
    expect(compareScenarios([])).toEqual([]);
  });
});

describe("buildApplyPreview", () => {
  it("summarises what applying would modify without mutating anything", () => {
    const preview = buildApplyPreview(
      scenario({
        id: "s1",
        changes: [
          change({ id: "c1", op: "COMPLETE", targetKind: "goal", targetLabel: "G" }),
          change({ id: "c2", op: "DEFER", targetKind: "deadline", targetLabel: "D" }),
          change({ id: "c3", op: "ADD", targetKind: "project", targetLabel: "P" }),
        ],
      }),
    );
    expect(preview.willModify).toEqual({ goals: 1, plans: 1, tasks: 0, deadlines: 1 });
    expect(preview.steps).toHaveLength(3);
    expect(preview.note).toMatch(/nothing is modified until you confirm/i);
  });
});
