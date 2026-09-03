import { describe, expect, it } from "vitest";
import { subtaskProgressByParent, summarizeTasks } from "./task-stats";
import type { Task } from "./schema";

function makeTask(over: Partial<Task> & Pick<Task, "id">): Task {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title: over.title ?? "Task",
    description: "",
    taskStatus: over.taskStatus ?? "todo",
    priority: over.priority ?? "medium",
    startDate: over.startDate ?? null,
    dueDate: over.dueDate ?? null,
    pillarIds: over.pillarIds ?? [],
    goalId: over.goalId ?? null,
    projectId: over.projectId ?? null,
    milestoneId: over.milestoneId ?? null,
    parentTaskId: over.parentTaskId ?? null,
    recurrence: over.recurrence ?? null,
    estimatedMinutes: over.estimatedMinutes ?? 0,
    actualMinutes: over.actualMinutes ?? 0,
    energyRequirement: over.energyRequirement ?? "medium",
    context: over.context ?? "",
    tags: over.tags ?? [],
    notes: "",
    completedAt: over.completedAt ?? null,
    resolutionReason: over.resolutionReason ?? "",
  };
}

const NOW = new Date("2026-09-04T12:00:00.000Z");

describe("summarizeTasks", () => {
  it("returns zeros for an empty list", () => {
    expect(summarizeTasks([], NOW)).toEqual({
      total: 0,
      open: 0,
      done: 0,
      blocked: 0,
      overdue: 0,
      dueToday: 0,
      loggedMinutes: 0,
    });
  });

  it("classifies open / overdue / due-today / done / blocked and sums logged minutes", () => {
    const stats = summarizeTasks(
      [
        makeTask({ id: "a", dueDate: "2026-09-01" }), // overdue
        makeTask({ id: "b", dueDate: "2026-09-04" }), // due today
        makeTask({ id: "c", taskStatus: "blocked", dueDate: "2026-09-02" }), // overdue + blocked
        makeTask({ id: "d", taskStatus: "done", actualMinutes: 40 }),
        makeTask({ id: "e", taskStatus: "cancelled" }), // ignored
        makeTask({ id: "f" }), // open, undated
      ],
      NOW,
    );
    expect(stats).toEqual({
      total: 6,
      open: 4,
      done: 1,
      blocked: 1,
      overdue: 2,
      dueToday: 1,
      loggedMinutes: 40,
    });
  });
});

describe("subtaskProgressByParent", () => {
  it("counts subtasks and closed ones per parent", () => {
    const map = subtaskProgressByParent([
      makeTask({ id: "p" }),
      makeTask({ id: "s1", parentTaskId: "p" }),
      makeTask({ id: "s2", parentTaskId: "p", taskStatus: "done" }),
      makeTask({ id: "s3", parentTaskId: "p", taskStatus: "cancelled" }),
      makeTask({ id: "x", parentTaskId: "other" }),
    ]);
    expect(map.get("p")).toEqual({ total: 3, done: 2 });
    expect(map.get("other")).toEqual({ total: 1, done: 0 });
  });
});
