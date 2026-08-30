import { describe, expect, it } from "vitest";
import {
  planCreateSchema,
  planFormSchema,
  planInputFromForm,
  planSchema,
  planUpdateSchema,
  type PlanFormValues,
} from "./schema";

const fullCreate = {
  horizon: "five-year",
  title: "Financial independence",
  objective: "Build a resilient financial base.",
  desiredOutcomes: ["Six months of expenses saved"],
  keyMeasures: ["Savings rate"],
  startDate: "2026-01-01",
  endDate: "2030-12-31",
  planStatus: "planned",
  progress: 0,
  reviewNotes: "",
  pillarIds: ["personal"],
  parentId: null,
};

describe("planCreateSchema", () => {
  it("accepts a fully specified plan", () => {
    expect(planCreateSchema.parse(fullCreate).horizon).toBe("five-year");
  });

  it("requires the core fields (no silent defaults)", () => {
    expect(
      planCreateSchema.safeParse({
        horizon: "five-year",
        title: "x",
        objective: "y",
        pillarIds: ["personal"],
      }).success,
    ).toBe(false);
  });

  it("accepts null dates but not an empty string", () => {
    expect(
      planCreateSchema.safeParse({ ...fullCreate, startDate: null, endDate: null }).success,
    ).toBe(true);
    expect(planCreateSchema.safeParse({ ...fullCreate, startDate: "" }).success).toBe(false);
  });

  it("enforces end >= start and progress bounds and known enums", () => {
    expect(
      planCreateSchema.safeParse({ ...fullCreate, startDate: "2030-01-01", endDate: "2026-01-01" })
        .success,
    ).toBe(false);
    expect(planCreateSchema.safeParse({ ...fullCreate, progress: 120 }).success).toBe(false);
    expect(planCreateSchema.safeParse({ ...fullCreate, progress: 50.5 }).success).toBe(false);
    expect(planCreateSchema.safeParse({ ...fullCreate, horizon: "decade" }).success).toBe(false);
    expect(planCreateSchema.safeParse({ ...fullCreate, planStatus: "paused" }).success).toBe(false);
  });

  it("caps the outcome / measure lists at 30", () => {
    const many = Array.from({ length: 31 }, (_, index) => `outcome ${index}`);
    expect(planCreateSchema.safeParse({ ...fullCreate, desiredOutcomes: many }).success).toBe(
      false,
    );
  });
});

describe("planUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(planUpdateSchema.safeParse({}).success).toBe(true);
    expect(planUpdateSchema.safeParse({ progress: 40 }).success).toBe(true);
    expect(planUpdateSchema.safeParse({ progress: 200 }).success).toBe(false);
  });
});

describe("planFormSchema + planInputFromForm", () => {
  const formValues: PlanFormValues = {
    horizon: "one-year",
    title: "Save 20%",
    objective: "Grow the buffer.",
    desiredOutcomes: [],
    keyMeasures: [],
    startDate: "",
    endDate: "",
    planStatus: "planned",
    progress: 0,
    reviewNotes: "",
    pillarIds: ["personal"],
  };

  it("allows empty date strings but still checks ordering", () => {
    expect(planFormSchema.safeParse(formValues).success).toBe(true);
    expect(
      planFormSchema.safeParse({ ...formValues, startDate: "2027-01-01", endDate: "2026-01-01" })
        .success,
    ).toBe(false);
  });

  it("maps form values to a repository input, empty dates → null", () => {
    const input = planInputFromForm(formValues, "vision-1");
    expect(input.startDate).toBeNull();
    expect(input.endDate).toBeNull();
    expect(input.parentId).toBe("vision-1");
    expect(planCreateSchema.safeParse(input).success).toBe(true);
  });
});

describe("planSchema", () => {
  it("validates a stored record", () => {
    const record = planSchema.parse({
      id: "p1",
      ...fullCreate,
      planStatus: "active",
      progress: 25,
      status: "active",
      version: 1,
      createdAt: "2026-08-29T00:00:00.000Z",
      updatedAt: "2026-08-29T00:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
    });
    expect(record.progress).toBe(25);
  });
});
