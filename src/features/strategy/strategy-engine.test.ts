import { describe, expect, it } from "vitest";
import type { DecisionRecord } from "@/features/decisions/schema";
import type { Goal } from "@/features/goals/schema";
import type { Plan } from "@/features/plans/schema";
import type { PredictiveSignal } from "@/features/predictions/prediction-model";
import {
  analyzeWhatIf,
  buildStrategicReview,
  buildStrategy,
  isEmptyStrategy,
  type StrategyInput,
} from "./strategy-engine";

const NOW = "2026-09-10T09:00:00.000Z";
const iso = (daysAgo: number) => new Date(Date.parse(NOW) - daysAgo * 86_400_000).toISOString();

function goal(over: Partial<Goal> & { id: string }): Goal {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: iso(120),
    updatedAt: over.updatedAt ?? iso(2),
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title: over.title ?? over.id,
    description: "",
    pillarIds: over.pillarIds ?? ["personal"],
    parentPlanId: over.parentPlanId ?? null,
    startDate: over.startDate ?? null,
    targetDate: over.targetDate ?? null,
    goalStatus: over.goalStatus ?? "in-progress",
    priority: over.priority ?? "medium",
    progress: over.progress ?? 25,
    measurementType: "percent",
    targetValue: null,
    currentValue: null,
    unit: "",
    reviewFrequency: "weekly",
  } as Goal;
}

function plan(over: Partial<Plan> & { id: string }): Plan {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: iso(120),
    updatedAt: over.updatedAt ?? iso(5),
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title: over.title ?? over.id,
    description: "",
    horizon: over.horizon ?? "month",
    pillarIds: ["personal"],
    parentId: null,
    startDate: over.startDate ?? null,
    endDate: over.endDate ?? null,
    planStatus: over.planStatus ?? "active",
    progress: over.progress ?? 30,
    objective: "objective",
    desiredOutcomes: [],
    keyMeasures: [],
    reviewNotes: "",
  } as Plan;
}

function signal(over: Partial<PredictiveSignal> & { id: string }): PredictiveSignal {
  return {
    id: over.id,
    category: over.category ?? "schedule-overload",
    urgency: over.urgency ?? "important",
    prediction: over.prediction ?? "The week looks overloaded",
    evidence: over.evidence ?? ["18h scheduled vs 12h typical"],
    confidence: "moderate",
    recommendation: "Re-sequence",
    generatedAt: NOW,
  };
}

function decision(over: Partial<DecisionRecord> & { id: string }): DecisionRecord {
  return {
    id: over.id,
    title: over.title ?? over.id,
    description: "",
    status: over.status ?? "ANALYZING",
    createdAt: NOW,
    updatedAt: NOW,
    decisionDate: "2026-09-10",
    dueDate: over.dueDate,
    domain: "plan",
    importance: "medium",
    urgency: "medium",
    context: over.context ?? "context",
    desiredOutcome: "",
    userPriority: "",
    constraints: [],
    assumptions: [],
    relatedGoals: over.relatedGoals ?? [],
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

function baseInput(over: Partial<StrategyInput> = {}): StrategyInput {
  return {
    nowIso: NOW,
    goals: over.goals ?? [],
    plans: over.plans ?? [],
    intelligence:
      over.intelligence === undefined
        ? { status: "ready", attention: [], patterns: [], recommendations: [], today: [] }
        : over.intelligence,
    predictions:
      over.predictions === undefined
        ? { status: "ready", enabled: true, signals: [] }
        : over.predictions,
    decisions: over.decisions ?? [],
    brain: over.brain ?? null,
  };
}

describe("buildStrategy", () => {
  it("is advisory-empty with a degradation note when there are no goals", () => {
    const state = buildStrategy(baseInput());
    expect(isEmptyStrategy(state)).toBe(true);
    expect(state.degraded.some((line) => line.includes("No goals yet"))).toBe(true);
    expect(state.scenarios).toHaveLength(5);
  });

  it("derives a strategic context from real counts only", () => {
    const state = buildStrategy(
      baseInput({
        goals: [goal({ id: "g1", priority: "high" }), goal({ id: "g2", progress: 40 })],
        plans: [plan({ id: "p1", planStatus: "active", horizon: "quarter" })],
      }),
    );
    expect(state.context.activeGoals).toBe(2);
    expect(state.context.strategicObjectives).toBe(1);
    expect(state.context.activePlans).toBe(1);
    expect(state.context.majorProjects).toBe(1);
    expect(state.context.progressState).toBe(33);
  });

  it("marks a plan-linked, recently-updated goal as aligned and a bare high-priority goal as weak", () => {
    const state = buildStrategy(
      baseInput({
        goals: [
          goal({ id: "g1", parentPlanId: "p1", updatedAt: iso(3) }),
          goal({ id: "g2", priority: "critical", parentPlanId: null, progress: 5 }),
        ],
        plans: [plan({ id: "p1", planStatus: "active" })],
      }),
    );
    expect(state.alignment.find((row) => row.goalId === "g1")?.level).toBe("aligned");
    expect(state.alignment.find((row) => row.goalId === "g2")?.level).toBe("weak");
  });

  it("flags strategic drift in neutral language for stalled goals and past-due plans", () => {
    const state = buildStrategy(
      baseInput({
        goals: [goal({ id: "g1", goalStatus: "in-progress", progress: 5, updatedAt: iso(40) })],
        plans: [plan({ id: "p1", planStatus: "planned", startDate: "2026-08-01" })],
      }),
    );
    const types = state.drift.map((signal) => signal.type);
    expect(types).toContain("unscheduled-progress");
    expect(types).toContain("postponed-plans");
    expect(state.drift[0]?.statement).not.toMatch(/should|must|lazy|fail/i);
  });

  it("classifies goal health from signals, not scores", () => {
    const state = buildStrategy(
      baseInput({
        goals: [
          goal({ id: "onhold", goalStatus: "on-hold" }),
          goal({ id: "new", progress: 0, targetDate: null, updatedAt: iso(1) }),
          goal({ id: "stalled", goalStatus: "in-progress", progress: 4, updatedAt: iso(45) }),
          goal({ id: "risk", targetDate: "2026-09-25", progress: 30 }),
          goal({ id: "ok", goalStatus: "in-progress", progress: 55, updatedAt: iso(3) }),
        ],
      }),
    );
    const state_of = (id: string) => state.goalHealth.find((row) => row.goalId === id)?.state;
    expect(state_of("onhold")).toBe("inactive");
    expect(state_of("new")).toBe("insufficient-data");
    expect(state_of("stalled")).toBe("stalled");
    expect(state_of("risk")).toBe("at-risk");
    expect(state_of("ok")).toBe("on-track");
  });

  it("surfaces a DECISION bottleneck for an unresolved decision linked to a goal", () => {
    const state = buildStrategy(
      baseInput({
        goals: [goal({ id: "g1", title: "Launch project" })],
        decisions: [decision({ id: "d1", status: "ANALYZING", relatedGoals: ["g1"], title: "Pick a vendor" })],
      }),
    );
    const bottleneck = state.bottlenecks.find((item) => item.type === "DECISION");
    expect(bottleneck?.relatedGoal).toBe("Launch project");
    expect(bottleneck?.statement).toContain("Pick a vendor");
  });

  it("reports a CAPACITY bottleneck from an existing schedule-overload prediction (no new engine)", () => {
    const state = buildStrategy(
      baseInput({
        goals: [goal({ id: "g1" })],
        predictions: { status: "ready", enabled: true, signals: [signal({ id: "s1", category: "schedule-overload" })] },
      }),
    );
    expect(state.bottlenecks.some((item) => item.type === "CAPACITY")).toBe(true);
  });

  it("builds opportunities with observation, evidence, benefit and assumptions", () => {
    const state = buildStrategy(
      baseInput({
        goals: [
          goal({ id: "g1", pillarIds: ["personal"] }),
          goal({ id: "g2", pillarIds: ["personal"] }),
        ],
      }),
    );
    const opp = state.opportunities[0];
    expect(opp?.observation).toBeTruthy();
    expect(opp?.evidence.length).toBeGreaterThan(0);
    expect(opp?.potentialBenefit).toBeTruthy();
    expect(opp?.assumptions.length).toBeGreaterThan(0);
  });

  it("exposes a trade-off when two strained high-priority goals compete", () => {
    const state = buildStrategy(
      baseInput({
        goals: [
          goal({ id: "a", title: "Ship v2", priority: "high", progress: 4, updatedAt: iso(40) }),
          goal({ id: "b", title: "Certification", priority: "critical", progress: 4, updatedAt: iso(40) }),
        ],
      }),
    );
    const tradeOff = state.tradeOffs.find((item) => item.id === "tradeoff:competing-priorities");
    expect(tradeOff?.optionA).toContain("Ship v2");
    expect(tradeOff?.optionB).toContain("Certification");
    expect(tradeOff?.potentialConsequence).toBeTruthy();
  });

  it("always produces the five scenarios and downgrades the horizon without predictions", () => {
    const withPredictions = buildStrategy(baseInput({ goals: [goal({ id: "g1" })] }));
    expect(withPredictions.scenarios.map((s) => s.kind)).toEqual([
      "current-course",
      "accelerate",
      "defer",
      "reduce",
      "restructure",
    ]);
    expect(withPredictions.scenarios[0]?.horizon).toBe("short");

    const noPredictions = buildStrategy(
      baseInput({ goals: [goal({ id: "g1" })], predictions: { status: "ready", enabled: false, signals: [] } }),
    );
    expect(noPredictions.scenarios[0]?.horizon).toBe("limited-data");
    expect(noPredictions.scenarios[0]?.implications.some((line) => line.includes("Limited predictive data"))).toBe(true);
  });

  it("separates FACT / ESTIMATE / ASSUMPTION in what-if analysis", () => {
    const input = baseInput({
      goals: [goal({ id: "g1", title: "Certification", progress: 20, priority: "high" })],
      plans: [plan({ id: "p1", planStatus: "active" })],
    });
    const result = analyzeWhatIf(input, { kind: "increase-focus", targetGoalId: "g1" });
    expect(result.question).toContain("Certification");
    expect(result.facts.length).toBeGreaterThan(0);
    expect(result.estimates.length).toBeGreaterThan(0);
    expect(result.assumptions.length).toBeGreaterThan(0);
  });

  it("structures every recommendation and never proposes an automatic APPLY of a major change", () => {
    const state = buildStrategy(
      baseInput({
        goals: [
          goal({ id: "a", title: "Ship v2", priority: "high", progress: 4, updatedAt: iso(40) }),
          goal({ id: "b", title: "Certification", priority: "critical", progress: 4, updatedAt: iso(40) }),
        ],
        decisions: [decision({ id: "d1", relatedGoals: ["a"], title: "Vendor choice" })],
      }),
    );
    expect(state.recommendations.length).toBeGreaterThan(0);
    for (const rec of state.recommendations) {
      expect(rec.title).toBeTruthy();
      expect(rec.observation).toBeTruthy();
      expect(rec.option).toBeTruthy();
      expect(rec.expectedBenefit).toBeTruthy();
      expect(rec.potentialDownside).toBeTruthy();
      expect(["high", "medium", "low", "insufficient-data"]).toContain(rec.confidence);
      expect(rec.userAction).toBe("REVIEW");
    }
  });

  it("ages strategic debt from postponed decisions, stale goals and past-due plans", () => {
    const state = buildStrategy(
      baseInput({
        goals: [goal({ id: "g1", goalStatus: "in-progress", updatedAt: iso(60), priority: "high" })],
        plans: [plan({ id: "p1", planStatus: "active", endDate: "2026-08-01" })],
        decisions: [decision({ id: "d1", status: "READY", dueDate: "2026-08-20" })],
      }),
    );
    const sources = state.strategicDebt.map((item) => item.source);
    expect(sources).toContain("decisions");
    expect(sources).toContain("goals");
    expect(sources).toContain("plans");
    expect(state.strategicDebt[0]?.ageDays).toBeGreaterThanOrEqual(state.strategicDebt.at(-1)?.ageDays ?? 0);
  });

  it("classifies changes using history/audit signals", () => {
    const state = buildStrategy(
      baseInput({
        goals: [goal({ id: "g1", title: "Read 12 books", goalStatus: "achieved", updatedAt: iso(3) })],
      }),
    );
    expect(state.changes.some((change) => change.kind === "RESOLVED" && change.area === "GOALS")).toBe(true);
  });

  it("degrades gracefully when intelligence and predictions are unavailable", () => {
    const state = buildStrategy(
      baseInput({
        goals: [goal({ id: "g1" })],
        intelligence: null,
        predictions: { status: "error", enabled: true, signals: [] },
      }),
    );
    expect(state.degraded.some((line) => line.includes("Intelligence signals unavailable"))).toBe(true);
    expect(state.degraded.some((line) => line.includes("Predictions unavailable"))).toBe(true);
    expect(state.goalHealth.length).toBe(1);
    expect(state.scenarios).toHaveLength(5);
  });
});

describe("buildStrategicReview", () => {
  const input = baseInput({
    goals: [
      goal({ id: "moving", title: "Portfolio site", progress: 60, updatedAt: iso(2) }),
      goal({ id: "stuck", title: "Certification", goalStatus: "in-progress", progress: 3, updatedAt: iso(40) }),
    ],
    plans: [plan({ id: "p1", planStatus: "planned", startDate: "2026-07-01" })],
  });

  it("builds a weekly review with hedged causal language", () => {
    const strategy = buildStrategy(input);
    const review = buildStrategicReview("weekly", input, strategy);
    expect(review.kind).toBe("weekly");
    expect(review.movedForward.join(" ")).toContain("Portfolio site");
    expect(review.didNotMove.join(" ")).toContain("Certification");
    expect(review.whyItMayMatter.every((line) => line.startsWith("Possible contributing factor"))).toBe(true);
    expect(review.categories).toBeUndefined();
    expect(review.questions).toBeUndefined();
  });

  it("adds KEEP / CHANGE / STOP / START categories for a monthly review", () => {
    const strategy = buildStrategy(input);
    const review = buildStrategicReview("monthly", input, strategy);
    expect(review.categories).toBeDefined();
    expect(Object.keys(review.categories ?? {})).toEqual(["keep", "change", "stop", "start"]);
  });

  it("adds strategic questions for a quarterly review", () => {
    const strategy = buildStrategy(input);
    const review = buildStrategicReview("quarterly", input, strategy);
    expect(review.questions?.length).toBeGreaterThan(0);
    expect(review.questions?.[0]).toContain("still matter");
  });
});
