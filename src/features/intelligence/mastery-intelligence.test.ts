import { describe, expect, it } from "vitest";
import type { MetricSummary, PeriodComparison } from "@/features/analytics/analytics-insights";
import type { Goal } from "@/features/goals/schema";
import type { Plan } from "@/features/plans/schema";
import type { Task } from "@/features/tasks/schema";
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

function goal(over: Partial<Goal> & { id: string; title: string }): Goal {
  const { id, title, ...rest } = over;
  return {
    id,
    userId: "u1",
    status: "active",
    version: 1,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title,
    description: "",
    pillarIds: ["personal"],
    parentPlanId: null,
    startDate: null,
    targetDate: null,
    goalStatus: "in-progress",
    priority: "high",
    progress: 40,
    measurementType: "percent",
    targetValue: null,
    currentValue: null,
    unit: "%",
    reviewFrequency: "weekly",
    notes: "",
    ...rest,
  };
}

function plan(over: Partial<Plan> & { id: string; title: string }): Plan {
  const { id, title, ...rest } = over;
  return {
    id,
    userId: "u1",
    status: "active",
    version: 1,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    horizon: "week",
    title,
    objective: "",
    desiredOutcomes: [],
    keyMeasures: [],
    startDate: null,
    endDate: null,
    planStatus: "active",
    progress: 20,
    reviewNotes: "",
    pillarIds: ["personal"],
    parentId: null,
    ...rest,
  };
}

function task(over: Partial<Task> & { id: string; title: string }): Task {
  const { id, title, ...rest } = over;
  return {
    id,
    userId: "u1",
    status: "active",
    version: 1,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title,
    description: "",
    taskStatus: "todo",
    priority: "high",
    startDate: null,
    dueDate: null,
    pillarIds: ["personal"],
    goalId: null,
    projectId: null,
    milestoneId: null,
    parentTaskId: null,
    recurrence: null,
    estimatedMinutes: 30,
    actualMinutes: 0,
    energyRequirement: "medium",
    context: "",
    tags: [],
    notes: "",
    completedAt: null,
    resolutionReason: "",
    ...rest,
  };
}

describe("buildIntelligence", () => {
  it("1. no data -> no fabricated insight", () => {
    const result = buildIntelligence({
      metrics: [],
      lifeScore: flat,
      periodLabel: "30 days",
      hasAnyData: false,
      goals: [],
      plans: [],
      tasks: [],
      deepWorkSessions: [],
      journalEntries: [],
      learningItems: [],
    });
    expect(result.insights).toEqual([]);
  });

  it("2. valid progress -> emits progress insight", () => {
    const result = buildIntelligence({
      metrics: [metric({ id: "focus", label: "Focus hours" })],
      lifeScore: flat,
      periodLabel: "30 days",
      hasAnyData: true,
      goals: [],
      plans: [],
      tasks: [],
      deepWorkSessions: [],
      journalEntries: [],
      learningItems: [],
    });
    expect(result.progress.some((insight) => insight.type === "PROGRESS")).toBe(true);
  });

  it("3. unfinished overdue/blocked items -> attention insight", () => {
    const result = buildIntelligence({
      metrics: [],
      lifeScore: flat,
      periodLabel: "30 days",
      hasAnyData: true,
      goals: [],
      plans: [],
      tasks: [
        task({ id: "t1", title: "Overdue", dueDate: "2026-09-01" }),
        task({ id: "t2", title: "Blocked", taskStatus: "blocked" }),
      ],
      deepWorkSessions: [],
      journalEntries: [],
      learningItems: [],
      nowIsoDate: "2026-09-10",
    });
    expect(result.attention.some((insight) => insight.relatedModule === "act")).toBe(true);
  });

  it("4+5. goal-plan alignment and no-support detection", () => {
    const supportedGoal = goal({ id: "g1", title: "Supported", parentPlanId: "p1" });
    const unsupportedGoal = goal({ id: "g2", title: "Unsupported", parentPlanId: null });

    const result = buildIntelligence({
      metrics: [],
      lifeScore: flat,
      periodLabel: "30 days",
      hasAnyData: true,
      goals: [supportedGoal, unsupportedGoal],
      plans: [plan({ id: "p1", title: "Plan 1" })],
      tasks: [],
      deepWorkSessions: [],
      journalEntries: [],
      learningItems: [],
    });

    expect(result.insights.some((insight) => insight.id === "goals-aligned")).toBe(true);
    expect(result.insights.some((insight) => insight.id === "goals-no-support")).toBe(true);
  });

  it("6. insufficient history -> no false pattern insight", () => {
    const result = buildIntelligence({
      metrics: [],
      lifeScore: flat,
      periodLabel: "30 days",
      hasAnyData: true,
      goals: [],
      plans: [],
      tasks: [],
      deepWorkSessions: [],
      journalEntries: [],
      learningItems: [],
    });
    expect(result.patterns).toEqual([]);
  });

  it("7+8. module-specific insight maps into module attention for brain integration", () => {
    const result = buildIntelligence({
      metrics: [],
      lifeScore: flat,
      periodLabel: "30 days",
      hasAnyData: true,
      goals: [],
      plans: [],
      tasks: [task({ id: "t1", title: "Blocked", taskStatus: "blocked" })],
      deepWorkSessions: [],
      journalEntries: [],
      learningItems: [],
      nowIsoDate: "2026-09-10",
    });

    expect(result.moduleAttention.act.count).toBeGreaterThan(0);
    expect(result.moduleAttention.goals.count).toBe(0);
  });
});
