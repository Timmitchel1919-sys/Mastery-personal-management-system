import { describe, expect, it } from "vitest";
import type { DecisionRecord } from "@/features/decisions/schema";
import type { Goal } from "@/features/goals/schema";
import type { Plan } from "@/features/plans/schema";
import type { Task } from "@/features/tasks/schema";
import type { ContextConflict } from "@/features/context/context-model";
import { buildStrategy, type StrategyInput } from "@/features/strategy/strategy-engine";
import { buildBaseline, type TwinInput } from "@/features/twin/digital-twin";
import {
  buildAdaptationProposals,
  buildDailyBrief,
  buildFocusHealth,
  buildNotifications,
  buildPlanHealth,
  buildProjectHealth,
  buildSignals,
  buildSystemHealth,
  detectProposalConflicts,
  isProposalStale,
  prioritizeProposals,
  type AdaptationInput,
  type Signal,
} from "./adaptation-model";

const NOW = "2026-09-10T09:00:00.000Z";
const iso = (daysAgo: number) => new Date(Date.parse(NOW) - daysAgo * 86_400_000).toISOString();
const ymd = (daysFromNow: number) => new Date(Date.parse(NOW) + daysFromNow * 86_400_000).toISOString().slice(0, 10);

function goal(over: Partial<Goal> & { id: string }): Goal {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: iso(90),
    updatedAt: over.updatedAt ?? iso(3),
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

function plan(over: Partial<Plan> & { id: string }): Plan {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: iso(90),
    updatedAt: over.updatedAt ?? iso(5),
    createdBy: "u",
    updatedBy: "u",
    archivedAt: null,
    title: over.title ?? over.id,
    description: "",
    horizon: over.horizon ?? "month",
    pillarIds: ["personal"],
    parentId: null,
    startDate: null,
    endDate: null,
    planStatus: over.planStatus ?? "active",
    progress: over.progress ?? 30,
    objective: "objective",
    desiredOutcomes: [],
    keyMeasures: [],
    reviewNotes: "",
  } as Plan;
}

function task(over: Partial<Task> & { id: string }): Task {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: iso(30),
    updatedAt: over.updatedAt ?? iso(1),
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
    projectId: over.projectId ?? null,
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

function strategyInput(over: Partial<StrategyInput> = {}): StrategyInput {
  return {
    nowIso: NOW,
    goals: over.goals ?? [],
    plans: over.plans ?? [],
    intelligence: over.intelligence ?? { status: "ready", attention: [], patterns: [], recommendations: [], today: [] },
    predictions: over.predictions ?? { status: "ready", enabled: true, signals: [] },
    decisions: over.decisions ?? [],
    brain: over.brain ?? null,
  };
}

function twinInput(over: Partial<TwinInput> = {}): TwinInput {
  return {
    nowIso: NOW,
    goals: over.goals ?? [],
    plans: over.plans ?? [],
    tasks: over.tasks ?? [],
    predictions: over.predictions ?? { enabled: true, status: "ready", signals: [] },
    decisions: over.decisions ?? [],
    ...(over.availableFocusHoursPerWeek !== undefined ? { availableFocusHoursPerWeek: over.availableFocusHoursPerWeek } : {}),
  };
}

function baseAdaptationInput(over: Partial<AdaptationInput> = {}): AdaptationInput {
  return {
    nowIso: NOW,
    strategy: over.strategy ?? null,
    predictions: over.predictions ?? { status: "ready", enabled: true, signals: [] },
    twin: over.twin ?? null,
    calibration: over.calibration ?? null,
    contextConflicts: over.contextConflicts ?? [],
    decisions: over.decisions ?? [],
    goals: over.goals ?? [],
    plans: over.plans ?? [],
    tasks: over.tasks ?? [],
    automationsPaused: over.automationsPaused ?? false,
    intelligenceStatus: over.intelligenceStatus ?? "ready",
  };
}

describe("buildSignals", () => {
  it("synthesises signals from Strategy drift, goal health and bottlenecks — nothing fabricated", () => {
    const strategy = buildStrategy(
      strategyInput({
        goals: [goal({ id: "g1", goalStatus: "in-progress", progress: 4, updatedAt: iso(40) })],
        decisions: [decision({ id: "d1", status: "ANALYZING", relatedGoals: ["g1"] })],
      }),
    );
    const signals = buildSignals(baseAdaptationInput({ strategy }));
    expect(signals.some((s) => s.type === "BEHAVIORAL_PATTERN_SIGNAL")).toBe(true);
    expect(signals.some((s) => s.type === "GOAL_SIGNAL")).toBe(true);
    expect(signals.every((s) => s.evidence.length > 0 || s.sourceModule === "strategy")).toBe(true);
  });

  it("sorts signals by severity, most severe first", () => {
    const signals = buildSignals(
      baseAdaptationInput({
        twin: buildBaseline(twinInput({ tasks: [task({ id: "t1", estimatedMinutes: 60 * 40 })] })),
        predictions: {
          status: "ready",
          enabled: true,
          signals: [
            { id: "p1", category: "deadline-risk", urgency: "critical", prediction: "x", evidence: ["e"], confidence: "high", generatedAt: NOW },
          ],
        },
      }),
    );
    expect(signals[0]?.severity).toBe("CRITICAL");
  });

  it("maps a schedule-overload prediction to a CAPACITY_SIGNAL and deadline-risk to DEADLINE_SIGNAL", () => {
    const signals = buildSignals(
      baseAdaptationInput({
        predictions: {
          status: "ready",
          enabled: true,
          signals: [
            { id: "s1", category: "schedule-overload", urgency: "important", prediction: "overloaded", evidence: ["e"], confidence: "moderate", generatedAt: NOW },
            { id: "s2", category: "deadline-risk", urgency: "important", prediction: "at risk", evidence: ["e"], confidence: "moderate", generatedAt: NOW },
          ],
        },
      }),
    );
    expect(signals.find((s) => s.id === "sig:prediction:s1")?.type).toBe("CAPACITY_SIGNAL");
    expect(signals.find((s) => s.id === "sig:prediction:s2")?.type).toBe("DEADLINE_SIGNAL");
  });

  it("ignores predictions when the user turned them off", () => {
    const signals = buildSignals(
      baseAdaptationInput({
        predictions: {
          status: "ready",
          enabled: false,
          signals: [{ id: "s1", category: "deadline-risk", urgency: "critical", prediction: "x", evidence: [], confidence: "high", generatedAt: NOW }],
        },
      }),
    );
    expect(signals).toHaveLength(0);
  });

  it("detects an over-committed digital twin as a CAPACITY_SIGNAL", () => {
    const twin = buildBaseline(twinInput({ tasks: [task({ id: "t1", estimatedMinutes: 60 * 30 })], availableFocusHoursPerWeek: 20 }));
    const signals = buildSignals(baseAdaptationInput({ twin }));
    expect(signals.find((s) => s.id === "sig:twin:capacity")).toBeDefined();
  });

  it("turns a strong historical overrun factor into a hedged LEARNING_SIGNAL", () => {
    const signals = buildSignals(baseAdaptationInput({ calibration: { estimateOverrunFactor: 1.6, sampleSize: 8 } }));
    const learning = signals.find((s) => s.type === "LEARNING_SIGNAL");
    expect(learning?.statement).toMatch(/typically run/i);
    expect(learning?.evidence[0]).toMatch(/8 completed/i);
  });

  it("surfaces a context conflict as a CONTEXT_SIGNAL", () => {
    const conflict: ContextConflict = { id: "c1", sourceIds: ["a", "b"], field: "date", statement: "conflict!", values: ["x", "y"] };
    const signals = buildSignals(baseAdaptationInput({ contextConflicts: [conflict] }));
    expect(signals.find((s) => s.type === "CONTEXT_SIGNAL")?.statement).toBe("conflict!");
  });

  it("requires at least 3 overdue tasks before raising an EXECUTION_SIGNAL", () => {
    const today = NOW.slice(0, 10);
    const few = buildSignals(baseAdaptationInput({ tasks: [task({ id: "t1", dueDate: ymd(-5) }), task({ id: "t2", dueDate: ymd(-5) })] }));
    expect(few.some((s) => s.type === "EXECUTION_SIGNAL")).toBe(false);
    const many = buildSignals(
      baseAdaptationInput({
        tasks: [
          task({ id: "t1", dueDate: ymd(-5) }),
          task({ id: "t2", dueDate: ymd(-5) }),
          task({ id: "t3", dueDate: ymd(-5) }),
        ],
      }),
    );
    expect(many.some((s) => s.type === "EXECUTION_SIGNAL")).toBe(true);
    expect(today).toBeTruthy();
  });

  it("deduplicates identical signals from overlapping sources", () => {
    const signals = buildSignals(
      baseAdaptationInput({
        contextConflicts: [
          { id: "c1", sourceIds: [], field: "date", statement: "same", values: [] },
          { id: "c2", sourceIds: [], field: "date", statement: "same", values: [] },
        ],
      }),
    );
    expect(signals.filter((s) => s.statement === "same")).toHaveLength(1);
  });
});

describe("health models", () => {
  it("marks a plan stale after 21+ days without an update", () => {
    const health = buildPlanHealth([plan({ id: "p1", updatedAt: iso(30) })], [goal({ id: "g1", parentPlanId: "p1" })], NOW);
    expect(health[0]?.state).toBe("stale");
  });

  it("marks an unlinked, zero-progress plan underutilized", () => {
    const health = buildPlanHealth([plan({ id: "p1", progress: 0, updatedAt: iso(2) })], [], NOW);
    expect(health[0]?.state).toBe("underutilized");
  });

  it("classifies project health from real task counts, never an arbitrary score", () => {
    const health = buildProjectHealth(
      [
        task({ id: "t1", projectId: "proj1", taskStatus: "done" }),
        task({ id: "t2", projectId: "proj1", taskStatus: "done" }),
      ],
      NOW,
    );
    expect(health[0]?.state).toBe("completed");
  });

  it("flags a delayed project from overdue tasks", () => {
    const health = buildProjectHealth([task({ id: "t1", projectId: "proj1", dueDate: ymd(-3) })], NOW);
    expect(health[0]?.state).toBe("delayed");
  });

  it("computes focus health from the twin's capacity model, not a new one", () => {
    const twin = buildBaseline(twinInput({ tasks: [task({ id: "t1", estimatedMinutes: 60 * 25 })], availableFocusHoursPerWeek: 20 }));
    expect(buildFocusHealth(twin).state).toBe("overloaded");
    expect(buildFocusHealth(null).state).toBe("insufficient-data");
  });

  it("separates system state from user state and never claims healthy when a source errored", () => {
    const health = buildSystemHealth({ intelligenceStatus: "error", predictionsStatus: "ready", twinStatus: "ready", automationsPaused: false });
    expect(health.healthy).toBe(false);
    expect(health.degradedAreas).toContain("Intelligence");
  });
});

describe("buildAdaptationProposals", () => {
  it("never proposes for a single insignificant (INFO/LOW-with-no-evidence) event", () => {
    const signals: Signal[] = [
      { id: "s1", type: "LEARNING_SIGNAL", severity: "LOW", statement: "x", evidence: [], sourceModule: "twin", detectedAt: NOW },
    ];
    expect(buildAdaptationProposals(signals, NOW)).toHaveLength(0);
  });

  it("proposes for HIGH/CRITICAL signals and MEDIUM signals backed by evidence", () => {
    const signals: Signal[] = [
      { id: "s1", type: "CAPACITY_SIGNAL", severity: "HIGH", statement: "overloaded", evidence: ["e"], sourceModule: "twin", detectedAt: NOW },
      { id: "s2", type: "GOAL_SIGNAL", severity: "MEDIUM", statement: "stalled", evidence: ["e1", "e2"], sourceModule: "strategy", detectedAt: NOW },
    ];
    const proposals = buildAdaptationProposals(signals, NOW);
    expect(proposals).toHaveLength(2);
    expect(proposals.every((p) => p.requiresApproval)).toBe(true);
    expect(proposals.every((p) => p.status === "PROPOSED")).toBe(true);
  });

  it("always answers WHAT / WHY / EVIDENCE / EXPECTED IMPACT / CONFIDENCE", () => {
    const signals: Signal[] = [
      { id: "s1", type: "DEADLINE_SIGNAL", severity: "CRITICAL", statement: "deadline at risk", evidence: ["e1", "e2", "e3"], sourceModule: "predictions", detectedAt: NOW },
    ];
    const [proposal] = buildAdaptationProposals(signals, NOW);
    expect(proposal?.title).toBeTruthy();
    expect(proposal?.currentState).toBe("deadline at risk");
    expect(proposal?.expectedImpact).toBeTruthy();
    expect(proposal?.confidence).toBe("high");
    expect(proposal?.evidence).toHaveLength(3);
  });
});

describe("isProposalStale", () => {
  it("marks a proposal stale once the underlying signal no longer holds", () => {
    const proposal = buildAdaptationProposals(
      [{ id: "s1", type: "CAPACITY_SIGNAL", severity: "HIGH", statement: "overloaded", evidence: ["e"], sourceModule: "twin", detectedAt: NOW }],
      NOW,
    )[0]!;
    expect(isProposalStale(proposal, new Set(["CAPACITY_SIGNAL:overloaded"]), NOW)).toBe(false);
    expect(isProposalStale(proposal, new Set(), NOW)).toBe(true);
  });

  it("marks a proposal stale after its validity window even if the signal persists", () => {
    const proposal = buildAdaptationProposals(
      [{ id: "s1", type: "CAPACITY_SIGNAL", severity: "HIGH", statement: "overloaded", evidence: ["e"], sourceModule: "twin", detectedAt: iso(2) }],
      iso(2),
    )[0]!;
    expect(isProposalStale(proposal, new Set(["CAPACITY_SIGNAL:overloaded"]), NOW)).toBe(true);
  });
});

describe("detectProposalConflicts", () => {
  it("flags opposing adaptation types instead of letting both apply", () => {
    const signals: Signal[] = [
      { id: "s1", type: "EXECUTION_SIGNAL", severity: "HIGH", statement: "a", evidence: ["e"], sourceModule: "tasks", detectedAt: NOW },
      { id: "s2", type: "GOAL_SIGNAL", severity: "HIGH", statement: "b", evidence: ["e"], sourceModule: "strategy", detectedAt: NOW },
    ];
    const proposals = buildAdaptationProposals(signals, NOW); // REDUCE_SCOPE + INCREASE_FOCUS
    const conflicts = detectProposalConflicts(proposals);
    expect(conflicts.length).toBeGreaterThan(0);
  });

  it("reports no conflicts for compatible proposals", () => {
    const signals: Signal[] = [
      { id: "s1", type: "DEADLINE_SIGNAL", severity: "HIGH", statement: "a", evidence: ["e"], sourceModule: "predictions", detectedAt: NOW },
    ];
    expect(detectProposalConflicts(buildAdaptationProposals(signals, NOW))).toHaveLength(0);
  });
});

describe("prioritizeProposals", () => {
  it("ranks higher-severity, higher-confidence proposals first — not an arbitrary order", () => {
    const signals: Signal[] = [
      { id: "low", type: "PLAN_SIGNAL", severity: "MEDIUM", statement: "low", evidence: ["e"], sourceModule: "plans", detectedAt: NOW },
      { id: "high", type: "CAPACITY_SIGNAL", severity: "CRITICAL", statement: "high", evidence: ["e1", "e2", "e3"], sourceModule: "twin", detectedAt: NOW },
    ];
    const proposals = buildAdaptationProposals(signals, NOW);
    const byId = new Map(signals.map((s) => [s.id, s]));
    const ranked = prioritizeProposals(proposals, byId);
    expect(ranked[0]?.trigger).toBe("CAPACITY_SIGNAL");
  });
});

describe("buildNotifications", () => {
  it("caps notifications and never fires one per minor signal", () => {
    const signals: Signal[] = Array.from({ length: 10 }, (_, i) => ({
      id: `s${i}`,
      type: "GOAL_SIGNAL" as const,
      severity: i < 8 ? ("INFO" as const) : ("CRITICAL" as const),
      statement: `sig ${i}`,
      evidence: [],
      sourceModule: "strategy" as const,
      detectedAt: NOW,
    }));
    const notifications = buildNotifications(signals, [], NOW);
    expect(notifications.length).toBeLessThanOrEqual(5);
    expect(notifications.every((n) => n.priority === "CRITICAL" || n.priority === "WARNING")).toBe(true);
  });
});

describe("buildDailyBrief", () => {
  it("summarises priorities, deadlines, conflicts, risks and recommended actions", () => {
    const signals: Signal[] = [
      { id: "s1", type: "DEADLINE_SIGNAL", severity: "HIGH", statement: "deadline", evidence: [], sourceModule: "predictions", detectedAt: NOW },
      { id: "s2", type: "GOAL_SIGNAL", severity: "MEDIUM", statement: "goal drift", evidence: ["e"], sourceModule: "strategy", detectedAt: NOW },
    ];
    const proposals = buildAdaptationProposals(signals, NOW);
    const brief = buildDailyBrief(signals, proposals, NOW);
    expect(brief.deadlines).toContain("deadline");
    expect(brief.priorities).toContain("goal drift");
    expect(brief.recommendedActions.length).toBeGreaterThan(0);
  });
});
