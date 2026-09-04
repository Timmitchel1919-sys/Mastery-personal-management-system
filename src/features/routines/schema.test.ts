import { describe, expect, it } from "vitest";
import {
  emptyRoutineStep,
  routineCreateSchema,
  routineFormSchema,
  routineInputFromForm,
  routineLogCreateSchema,
  routineSchema,
  routineUpdateSchema,
  type RoutineFormValues,
} from "./schema";

const full = {
  title: "Morning routine",
  description: "",
  routineType: "morning" as const,
  pillarIds: ["spiritual" as const],
  isTemplate: false,
  steps: [{ id: "s1", title: "Pray", estimatedMinutes: 10, habitId: null }],
};

describe("routineCreateSchema", () => {
  it("accepts a fully specified routine", () => {
    expect(routineCreateSchema.parse(full).title).toBe("Morning routine");
  });

  it("requires a title and rejects an unknown type", () => {
    expect(routineCreateSchema.safeParse({ ...full, title: "" }).success).toBe(false);
    expect(routineCreateSchema.safeParse({ ...full, routineType: "afternoon" }).success).toBe(
      false,
    );
  });

  it("requires every step to have a non-empty title", () => {
    expect(
      routineCreateSchema.safeParse({
        ...full,
        steps: [{ id: "s1", title: "", estimatedMinutes: 0, habitId: null }],
      }).success,
    ).toBe(false);
  });

  it("allows zero steps and an empty pillar list", () => {
    expect(routineCreateSchema.safeParse({ ...full, steps: [], pillarIds: [] }).success).toBe(true);
  });
});

describe("routineUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(routineUpdateSchema.safeParse({}).success).toBe(true);
    expect(routineUpdateSchema.safeParse({ isTemplate: true }).success).toBe(true);
  });
});

describe("emptyRoutineStep", () => {
  it("generates a fresh, non-empty step id each time", () => {
    const a = emptyRoutineStep();
    const b = emptyRoutineStep();
    expect(a.id).toBeTruthy();
    expect(a.id).not.toBe(b.id);
    expect(a.title).toBe("");
  });
});

describe("routineFormSchema + routineInputFromForm", () => {
  const form: RoutineFormValues = {
    title: "Evening wind-down",
    description: "",
    routineType: "evening",
    pillarIds: [],
    isTemplate: false,
    steps: [
      { id: "s1", title: "Journal", estimatedMinutes: 5, habitId: "" },
      { id: "s2", title: "Read", estimatedMinutes: 20, habitId: "habit-1" },
    ],
  };

  it("validates the form shape", () => {
    expect(routineFormSchema.safeParse(form).success).toBe(true);
  });

  it("maps blank habit links to null and keeps step ids stable", () => {
    const input = routineInputFromForm(form);
    expect(input.steps[0]?.habitId).toBeNull();
    expect(input.steps[1]?.habitId).toBe("habit-1");
    expect(input.steps.map((s) => s.id)).toEqual(["s1", "s2"]);
    expect(routineCreateSchema.safeParse(input).success).toBe(true);
  });
});

describe("routineLogCreateSchema", () => {
  it("requires a routineId and a YYYY-MM-DD date", () => {
    expect(
      routineLogCreateSchema.safeParse({
        routineId: "r1",
        date: "2026-09-02",
        completedStepIds: ["s1"],
        notes: "",
      }).success,
    ).toBe(true);
    expect(
      routineLogCreateSchema.safeParse({
        routineId: "",
        date: "2026-09-02",
        completedStepIds: [],
        notes: "",
      }).success,
    ).toBe(false);
  });
});

describe("routineSchema", () => {
  it("validates a stored record", () => {
    const record = routineSchema.parse({
      id: "r1",
      ...full,
      status: "active",
      version: 1,
      createdAt: "2026-09-02T08:00:00.000Z",
      updatedAt: "2026-09-02T08:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
    });
    expect(record.routineType).toBe("morning");
  });
});
