import { describe, expect, it } from "vitest";
import type { Goal } from "@/features/goals/schema";
import type { Task } from "@/features/tasks/schema";
import { buildExecutionRecommendations } from "./execution-recommendation";

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
    progress: 35,
    measurementType: "percent",
    targetValue: null,
    currentValue: null,
    unit: "%",
    reviewFrequency: "weekly",
    notes: "",
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
    priority: "medium",
    startDate: null,
    dueDate: null,
    pillarIds: ["personal"],
    goalId: null,
    projectId: null,
    milestoneId: null,
    parentTaskId: null,
    recurrence: null,
    estimatedMinutes: 45,
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

describe("buildExecutionRecommendations", () => {
  it("returns no recommendations for empty state", () => {
    expect(
      buildExecutionRecommendations({ goals: [], plans: [], tasks: [], nowIsoDate: "2026-09-10" }),
    ).toEqual([]);
  });

  it("creates a review recommendation for unsupported goals", () => {
    const result = buildExecutionRecommendations({
      goals: [goal({ id: "g1", title: "Launch Mastery" })],
      plans: [],
      tasks: [],
      nowIsoDate: "2026-09-10",
    });

    expect(result.some((item) => item.type === "REVIEW_GOAL")).toBe(true);
    expect(result[0]?.requiresApproval).toBe(true);
  });

  it("creates a task prioritization recommendation for overdue or blocked work", () => {
    const result = buildExecutionRecommendations({
      goals: [],
      plans: [],
      tasks: [
        task({ id: "t1", title: "Ship launch checklist", dueDate: "2026-09-01", taskStatus: "todo" }),
        task({ id: "t2", title: "Wait on legal feedback", taskStatus: "blocked" }),
      ],
      nowIsoDate: "2026-09-10",
    });

    expect(result.some((item) => item.type === "REVIEW_OVERDUE_ITEM")).toBe(true);
    expect(result.some((item) => item.type === "PRIORITIZE_ACTION")).toBe(true);
  });
});
