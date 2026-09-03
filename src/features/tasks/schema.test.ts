import { describe, expect, it } from "vitest";
import {
  daysOverdue,
  isClosed,
  taskCreateSchema,
  taskFormSchema,
  taskInputFromForm,
  taskSchema,
  taskUpdateSchema,
  type TaskFormValues,
} from "./schema";

const full = {
  title: "Draft the report",
  description: "",
  taskStatus: "todo" as const,
  priority: "high" as const,
  startDate: "2026-09-01",
  dueDate: "2026-09-05",
  pillarIds: ["personal" as const],
  goalId: null,
  projectId: null,
  milestoneId: null,
  parentTaskId: null,
  recurrence: null,
  estimatedMinutes: 120,
  actualMinutes: 0,
  energyRequirement: "medium" as const,
  context: "@computer",
  tags: ["writing"],
  notes: "",
  completedAt: null,
  resolutionReason: "",
};

describe("taskCreateSchema", () => {
  it("accepts a fully specified task", () => {
    expect(taskCreateSchema.parse(full).title).toBe("Draft the report");
  });

  it("requires a title and rejects unknown enums", () => {
    expect(taskCreateSchema.safeParse({ ...full, title: "" }).success).toBe(false);
    expect(taskCreateSchema.safeParse({ ...full, taskStatus: "later" }).success).toBe(false);
    expect(taskCreateSchema.safeParse({ ...full, priority: "urgent" }).success).toBe(false);
    expect(taskCreateSchema.safeParse({ ...full, energyRequirement: "extreme" }).success).toBe(
      false,
    );
  });

  it("rejects a due date before the start date", () => {
    expect(
      taskCreateSchema.safeParse({ ...full, startDate: "2026-09-05", dueDate: "2026-09-01" })
        .success,
    ).toBe(false);
  });

  it("allows null dates and a null recurrence, caps tags at 20", () => {
    expect(taskCreateSchema.safeParse({ ...full, startDate: null, dueDate: null }).success).toBe(
      true,
    );
    expect(
      taskCreateSchema.safeParse({
        ...full,
        tags: Array.from({ length: 21 }, (_, i) => `t${i}`),
      }).success,
    ).toBe(false);
  });

  it("accepts a recurrence rule", () => {
    expect(
      taskCreateSchema.safeParse({ ...full, recurrence: { frequency: "weekly", interval: 2 } })
        .success,
    ).toBe(true);
  });
});

describe("taskUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(taskUpdateSchema.safeParse({}).success).toBe(true);
    expect(taskUpdateSchema.safeParse({ taskStatus: "done", completedAt: null }).success).toBe(
      true,
    );
    expect(taskUpdateSchema.safeParse({ priority: "nope" }).success).toBe(false);
  });
});

describe("taskFormSchema + taskInputFromForm", () => {
  const form: TaskFormValues = {
    title: "Review PRs",
    description: "",
    taskStatus: "done",
    priority: "medium",
    startDate: "",
    dueDate: "2026-09-10",
    pillarIds: [],
    goalId: "",
    projectId: "project-1",
    milestoneId: "",
    parentTaskId: "",
    recurrence: "weekly",
    recurrenceInterval: 1,
    estimatedMinutes: 30,
    actualMinutes: 25,
    energyRequirement: "low",
    context: "",
    tags: ["review"],
    notes: "",
    resolutionReason: "",
  };

  it("validates the form shape and rejects a due date before the start", () => {
    expect(taskFormSchema.safeParse(form).success).toBe(true);
    expect(
      taskFormSchema.safeParse({ ...form, startDate: "2026-09-20", dueDate: "2026-09-10" }).success,
    ).toBe(false);
  });

  it("sets completedAt when the status is done and dedupes tags", () => {
    const now = new Date("2026-09-11T08:00:00.000Z");
    const input = taskInputFromForm({ ...form, tags: ["review", "review", "  "] }, null, now);
    expect(input.completedAt).toBe("2026-09-11T08:00:00.000Z");
    expect(input.tags).toEqual(["review"]);
    expect(input.projectId).toBe("project-1");
    expect(input.recurrence).toEqual({ frequency: "weekly", interval: 1 });
    expect(taskCreateSchema.safeParse(input).success).toBe(true);
  });

  it("keeps an existing completedAt on re-save", () => {
    const input = taskInputFromForm(form, "2026-09-01T00:00:00.000Z");
    expect(input.completedAt).toBe("2026-09-01T00:00:00.000Z");
  });

  it("clears completedAt when the status is not done", () => {
    const input = taskInputFromForm({ ...form, taskStatus: "todo" }, "2026-09-01T00:00:00.000Z");
    expect(input.completedAt).toBeNull();
  });
});

describe("daysOverdue + isClosed", () => {
  it("counts whole days past a due date for open tasks only", () => {
    expect(daysOverdue({ dueDate: "2026-09-01", taskStatus: "todo" }, "2026-09-04")).toBe(3);
    expect(daysOverdue({ dueDate: "2026-09-10", taskStatus: "todo" }, "2026-09-04")).toBe(0);
    expect(daysOverdue({ dueDate: "2026-09-01", taskStatus: "done" }, "2026-09-04")).toBe(0);
    expect(daysOverdue({ dueDate: null, taskStatus: "todo" }, "2026-09-04")).toBe(0);
  });

  it("treats done and cancelled as closed", () => {
    expect(isClosed("done")).toBe(true);
    expect(isClosed("cancelled")).toBe(true);
    expect(isClosed("blocked")).toBe(false);
  });
});

describe("taskSchema", () => {
  it("validates a stored record", () => {
    const record = taskSchema.parse({
      id: "t1",
      ...full,
      status: "active",
      version: 1,
      createdAt: "2026-09-01T10:00:00.000Z",
      updatedAt: "2026-09-01T10:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
    });
    expect(record.taskStatus).toBe("todo");
  });
});
