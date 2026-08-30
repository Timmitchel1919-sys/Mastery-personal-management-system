import { describe, expect, it } from "vitest";
import {
  goalCreateSchema,
  goalFormSchema,
  goalInputFromForm,
  goalSchema,
  goalUpdateSchema,
  type GoalFormValues,
} from "./schema";

const fullGoal = {
  title: "Run a half marathon",
  description: "Train consistently for six months.",
  pillarIds: ["personal"],
  parentPlanId: null,
  startDate: "2026-01-01",
  targetDate: "2026-06-30",
  goalStatus: "in-progress",
  priority: "high",
  progress: 20,
  measurementType: "duration",
  targetValue: 21,
  currentValue: 8,
  unit: "km",
  reviewFrequency: "weekly",
  notes: "",
};

describe("goalCreateSchema", () => {
  it("accepts a fully specified goal", () => {
    const parsed = goalCreateSchema.parse(fullGoal);
    expect(parsed.title).toBe("Run a half marathon");
    expect(parsed.targetValue).toBe(21);
  });

  it("requires the core fields", () => {
    expect(goalCreateSchema.safeParse({ title: "x", pillarIds: ["personal"] }).success).toBe(false);
  });

  it("allows null dates and null measure values but not an empty date string", () => {
    expect(
      goalCreateSchema.safeParse({
        ...fullGoal,
        startDate: null,
        targetDate: null,
        targetValue: null,
        currentValue: null,
      }).success,
    ).toBe(true);
    expect(goalCreateSchema.safeParse({ ...fullGoal, startDate: "" }).success).toBe(false);
  });

  it("enforces target >= start, progress bounds, unit length, and known enums", () => {
    expect(
      goalCreateSchema.safeParse({ ...fullGoal, startDate: "2026-07-01", targetDate: "2026-01-01" })
        .success,
    ).toBe(false);
    expect(goalCreateSchema.safeParse({ ...fullGoal, progress: 150 }).success).toBe(false);
    expect(goalCreateSchema.safeParse({ ...fullGoal, unit: "x".repeat(25) }).success).toBe(false);
    expect(goalCreateSchema.safeParse({ ...fullGoal, goalStatus: "paused" }).success).toBe(false);
    expect(goalCreateSchema.safeParse({ ...fullGoal, priority: "urgent" }).success).toBe(false);
    expect(goalCreateSchema.safeParse({ ...fullGoal, measurementType: "weight" }).success).toBe(
      false,
    );
    expect(goalCreateSchema.safeParse({ ...fullGoal, reviewFrequency: "daily" }).success).toBe(
      false,
    );
  });
});

describe("goalUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(goalUpdateSchema.safeParse({}).success).toBe(true);
    expect(goalUpdateSchema.safeParse({ progress: 60, goalStatus: "achieved" }).success).toBe(true);
    expect(goalUpdateSchema.safeParse({ progress: -1 }).success).toBe(false);
  });
});

describe("goalFormSchema + goalInputFromForm", () => {
  const formValues: GoalFormValues = {
    title: "Read 12 books",
    description: "",
    pillarIds: ["personal"],
    parentPlanId: "",
    startDate: "",
    targetDate: "",
    goalStatus: "not-started",
    priority: "medium",
    progress: 0,
    measurementType: "count",
    targetValue: 12,
    currentValue: null,
    unit: "books",
    reviewFrequency: "monthly",
    notes: "",
  };

  it("accepts empty date strings", () => {
    expect(goalFormSchema.safeParse(formValues).success).toBe(true);
  });

  it("maps blank plan / dates to null and keeps numbers", () => {
    const input = goalInputFromForm(formValues);
    expect(input.parentPlanId).toBeNull();
    expect(input.startDate).toBeNull();
    expect(input.targetValue).toBe(12);
    expect(input.currentValue).toBeNull();
    expect(goalCreateSchema.safeParse(input).success).toBe(true);
  });
});

describe("goalSchema", () => {
  it("validates a stored record", () => {
    const record = goalSchema.parse({
      id: "g1",
      ...fullGoal,
      status: "active",
      version: 1,
      createdAt: "2026-08-29T00:00:00.000Z",
      updatedAt: "2026-08-29T00:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
    });
    expect(record.priority).toBe("high");
  });
});
