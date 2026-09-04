import { describe, expect, it } from "vitest";
import {
  habitCreateSchema,
  habitFormSchema,
  habitInputFromForm,
  habitLogCreateSchema,
  habitSchema,
  habitUpdateSchema,
  type HabitFormValues,
} from "./schema";

const full = {
  title: "Morning prayer",
  description: "",
  pillarIds: ["spiritual" as const],
  goalId: null,
  frequency: "daily" as const,
  interval: 1,
  weekdays: [] as number[],
  daysOfMonth: [] as number[],
  target: 1,
  unit: "session",
  reminderTime: "06:30",
  habitStatus: "active" as const,
};

describe("habitCreateSchema", () => {
  it("accepts a fully specified habit", () => {
    expect(habitCreateSchema.parse(full).title).toBe("Morning prayer");
  });

  it("requires a title and at least one pillar", () => {
    expect(habitCreateSchema.safeParse({ ...full, title: "" }).success).toBe(false);
    expect(habitCreateSchema.safeParse({ ...full, pillarIds: [] }).success).toBe(false);
  });

  it("rejects an unknown frequency or a malformed reminder time", () => {
    expect(habitCreateSchema.safeParse({ ...full, frequency: "yearly" }).success).toBe(false);
    expect(habitCreateSchema.safeParse({ ...full, reminderTime: "6:30am" }).success).toBe(false);
  });

  it("allows a null reminder time and empty weekdays / days of month", () => {
    expect(habitCreateSchema.safeParse({ ...full, reminderTime: null }).success).toBe(true);
  });
});

describe("habitUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(habitUpdateSchema.safeParse({}).success).toBe(true);
    expect(habitUpdateSchema.safeParse({ habitStatus: "paused" }).success).toBe(true);
    expect(habitUpdateSchema.safeParse({ frequency: "never" }).success).toBe(false);
  });
});

describe("habitFormSchema + habitInputFromForm", () => {
  const form: HabitFormValues = {
    title: "Read scripture",
    description: "",
    pillarIds: ["spiritual"],
    goalId: "",
    frequency: "monthly",
    interval: 1,
    weekdays: [2, 4],
    daysOfMonthText: "1, 15, 15, 40",
    target: 10,
    unit: "pages",
    reminderTime: "",
    habitStatus: "active",
  };

  it("validates the form shape", () => {
    expect(habitFormSchema.safeParse(form).success).toBe(true);
  });

  it("only keeps the fields relevant to the chosen frequency, dedupes/clamps days of month", () => {
    const input = habitInputFromForm(form);
    expect(input.weekdays).toEqual([]); // frequency is monthly, not weekly
    expect(input.daysOfMonth).toEqual([1, 15]); // deduped, sorted, 40 dropped
    expect(input.reminderTime).toBeNull();
    expect(input.goalId).toBeNull();
    expect(habitCreateSchema.safeParse(input).success).toBe(true);
  });
});

describe("habitLogCreateSchema", () => {
  it("requires a habitId and a YYYY-MM-DD date", () => {
    expect(
      habitLogCreateSchema.safeParse({
        habitId: "h1",
        date: "2026-09-01",
        logStatus: "completed",
        value: 0,
        notes: "",
      }).success,
    ).toBe(true);
    expect(
      habitLogCreateSchema.safeParse({
        habitId: "",
        date: "2026-09-01",
        logStatus: "completed",
        value: 0,
        notes: "",
      }).success,
    ).toBe(false);
    expect(
      habitLogCreateSchema.safeParse({
        habitId: "h1",
        date: "09/01/2026",
        logStatus: "completed",
        value: 0,
        notes: "",
      }).success,
    ).toBe(false);
  });
});

describe("habitSchema", () => {
  it("validates a stored record", () => {
    const record = habitSchema.parse({
      id: "h1",
      ...full,
      status: "active",
      version: 1,
      createdAt: "2026-09-01T08:00:00.000Z",
      updatedAt: "2026-09-01T08:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
    });
    expect(record.frequency).toBe("daily");
  });
});
