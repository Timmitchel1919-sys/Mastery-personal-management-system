import { describe, expect, it } from "vitest";
import {
  kpiAttainment,
  kpiCreateSchema,
  kpiEntryCreateSchema,
  kpiEntryFormSchema,
  kpiEntryInputFromForm,
  kpiFormSchema,
  kpiInputFromForm,
  kpiSchema,
  kpiUpdateSchema,
  type KpiEntryFormValues,
  type KpiFormValues,
} from "./schema";

const full = {
  title: "Sleep hours",
  description: "",
  category: "Health",
  pillarIds: ["personal" as const],
  unit: "hours",
  direction: "higher-is-better" as const,
  targetValue: 8,
  weight: 3,
  goalId: null,
  notes: "",
};

describe("kpiCreateSchema", () => {
  it("accepts a fully specified KPI", () => {
    expect(kpiCreateSchema.parse(full).title).toBe("Sleep hours");
  });

  it("requires a title and rejects an unknown direction", () => {
    expect(kpiCreateSchema.safeParse({ ...full, title: "" }).success).toBe(false);
    expect(kpiCreateSchema.safeParse({ ...full, direction: "sideways" }).success).toBe(false);
  });

  it("rejects weight outside 1-5", () => {
    expect(kpiCreateSchema.safeParse({ ...full, weight: 0 }).success).toBe(false);
    expect(kpiCreateSchema.safeParse({ ...full, weight: 6 }).success).toBe(false);
  });

  it("allows a null target", () => {
    expect(kpiCreateSchema.safeParse({ ...full, targetValue: null }).success).toBe(true);
  });
});

describe("kpiUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(kpiUpdateSchema.safeParse({}).success).toBe(true);
    expect(kpiUpdateSchema.safeParse({ weight: 5 }).success).toBe(true);
  });
});

describe("kpiSchema", () => {
  it("validates a stored record", () => {
    const record = kpiSchema.parse({
      id: "k1",
      ...full,
      status: "active",
      version: 1,
      createdAt: "2026-09-02T10:00:00.000Z",
      updatedAt: "2026-09-02T10:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
      archivedAt: null,
    });
    expect(record.direction).toBe("higher-is-better");
  });
});

describe("kpiFormSchema + kpiInputFromForm", () => {
  const form: KpiFormValues = {
    title: "Sleep hours",
    description: "",
    category: "Health",
    pillarIds: [],
    unit: "hours",
    direction: "higher-is-better",
    targetValue: 8,
    weight: 3,
    goalId: "goal-1",
    notes: "",
  };

  it("validates the form shape", () => {
    expect(kpiFormSchema.safeParse(form).success).toBe(true);
  });

  it("maps a blank goal to null", () => {
    const input = kpiInputFromForm(form);
    expect(input.goalId).toBe("goal-1");
    expect(kpiCreateSchema.safeParse(input).success).toBe(true);

    const blank = kpiInputFromForm({ ...form, goalId: "" });
    expect(blank.goalId).toBeNull();
  });
});

describe("kpiAttainment", () => {
  it("returns null with no target", () => {
    expect(kpiAttainment({ targetValue: null, direction: "higher-is-better" }, 10)).toBeNull();
  });

  it("scales 0-100 toward a higher-is-better target and clamps above it", () => {
    const kpi = { targetValue: 8, direction: "higher-is-better" as const };
    expect(kpiAttainment(kpi, 4)).toBe(50);
    expect(kpiAttainment(kpi, 8)).toBe(100);
    expect(kpiAttainment(kpi, 16)).toBe(100);
    expect(kpiAttainment(kpi, 0)).toBe(0);
  });

  it("scales 0-100 toward a lower-is-better target: at/under target is 100", () => {
    const kpi = { targetValue: 2, direction: "lower-is-better" as const };
    expect(kpiAttainment(kpi, 1)).toBe(100);
    expect(kpiAttainment(kpi, 2)).toBe(100);
    expect(kpiAttainment(kpi, 4)).toBe(50);
  });

  it("treats a target of exactly 0 as pass/fail in both directions", () => {
    expect(kpiAttainment({ targetValue: 0, direction: "higher-is-better" }, 0)).toBe(100);
    expect(kpiAttainment({ targetValue: 0, direction: "higher-is-better" }, -1)).toBe(0);
    expect(kpiAttainment({ targetValue: 0, direction: "lower-is-better" }, 0)).toBe(100);
    expect(kpiAttainment({ targetValue: 0, direction: "lower-is-better" }, 1)).toBe(0);
  });
});

describe("kpiEntryCreateSchema + kpiEntryInputFromForm", () => {
  const form: KpiEntryFormValues = { date: "2026-09-02", value: 7.5, note: "" };

  it("validates the form shape and attaches the kpiId", () => {
    expect(kpiEntryFormSchema.safeParse(form).success).toBe(true);
    const input = kpiEntryInputFromForm("kpi-1", form);
    expect(input).toEqual({ kpiId: "kpi-1", date: "2026-09-02", value: 7.5, note: "" });
    expect(kpiEntryCreateSchema.safeParse(input).success).toBe(true);
  });
});
