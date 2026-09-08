import { describe, expect, it } from "vitest";
import type { Task } from "@/features/tasks/schema";
import { isStale, pickNextBestTask } from "./action-model";

const TODAY = "2026-03-10";

function task(over: Partial<Task> & { id: string }): Task {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title: over.title ?? over.id,
    description: "",
    taskStatus: over.taskStatus ?? "todo",
    priority: over.priority ?? "medium",
    startDate: over.startDate ?? null,
    dueDate: over.dueDate ?? null,
    pillarIds: [],
    goalId: over.goalId ?? null,
    projectId: null,
    milestoneId: null,
    parentTaskId: null,
    recurrence: null,
    estimatedMinutes: over.estimatedMinutes ?? 0,
    actualMinutes: 0,
    energyRequirement: "medium",
    context: "",
    tags: [],
    notes: "",
    completedAt: null,
    resolutionReason: "",
  };
}

describe("isStale", () => {
  it("is false when either signature is unknown", () => {
    expect(isStale({ targetSignature: undefined }, "abc")).toBe(false);
    expect(isStale({ targetSignature: "abc" }, undefined)).toBe(false);
  });
  it("is true only when the signatures differ", () => {
    expect(isStale({ targetSignature: "abc" }, "abc")).toBe(false);
    expect(isStale({ targetSignature: "abc" }, "xyz")).toBe(true);
  });
});

describe("pickNextBestTask", () => {
  it("returns null when there are no open tasks", () => {
    expect(pickNextBestTask([], TODAY)).toBeNull();
    expect(
      pickNextBestTask([task({ id: "a", taskStatus: "done" }), task({ id: "b", taskStatus: "cancelled" })], TODAY),
    ).toBeNull();
  });

  it("orders by priority first", () => {
    const result = pickNextBestTask(
      [
        task({ id: "low", priority: "low", dueDate: TODAY }),
        task({ id: "crit", priority: "critical", dueDate: "2026-12-31" }),
      ],
      TODAY,
    );
    expect(result?.task.id).toBe("crit");
    expect(result?.why).toContain("Critical priority");
  });

  it("breaks ties by due-date proximity, overdue first", () => {
    const result = pickNextBestTask(
      [
        task({ id: "later", priority: "high", dueDate: "2026-03-20" }),
        task({ id: "overdue", priority: "high", dueDate: "2026-03-01" }),
        task({ id: "none", priority: "high", dueDate: null }),
      ],
      TODAY,
    );
    expect(result?.task.id).toBe("overdue");
    expect(result?.why.some((w) => /overdue by 9 days/i.test(w))).toBe(true);
  });

  it("breaks remaining ties by the lightest estimate", () => {
    const result = pickNextBestTask(
      [
        task({ id: "big", priority: "medium", estimatedMinutes: 120 }),
        task({ id: "small", priority: "medium", estimatedMinutes: 15 }),
      ],
      TODAY,
    );
    expect(result?.task.id).toBe("small");
    expect(result?.why).toContain("Estimated 15 min");
  });

  it("notes a goal link and a fallback reason", () => {
    const linked = pickNextBestTask([task({ id: "g", priority: "medium", goalId: "goal-1" })], TODAY);
    expect(linked?.why).toContain("Linked to a goal");

    const plain = pickNextBestTask([task({ id: "p", priority: "medium" })], TODAY);
    expect(plain?.why).toContain("Next open task by priority");
  });
});
