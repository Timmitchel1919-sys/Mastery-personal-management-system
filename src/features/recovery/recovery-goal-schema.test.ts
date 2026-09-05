import { describe, expect, it } from "vitest";
import {
  recoveryGoalCreateSchema,
  recoveryGoalFormSchema,
  recoveryGoalInputFromForm,
  recoveryGoalSchema,
  recoveryGoalUpdateSchema,
  type RecoveryGoalFormValues,
} from "./recovery-goal-schema";

const full = {
  behavior: "Late-night doomscrolling",
  description: "",
  motivation: "I want mornings back",
  startDate: "2026-09-01",
  triggers: ["Boredom after dinner"],
  warningSigns: ["Phone in bed"],
  copingStrategies: ["Charge phone in the kitchen"],
  supportNotes: "",
  faithBasedEncouragement: false,
  recoveryStatus: "active" as const,
};

describe("recoveryGoalCreateSchema", () => {
  it("accepts a fully specified goal", () => {
    expect(recoveryGoalCreateSchema.parse(full).behavior).toBe("Late-night doomscrolling");
  });

  it("requires a behavior and rejects an unknown status", () => {
    expect(recoveryGoalCreateSchema.safeParse({ ...full, behavior: "" }).success).toBe(false);
    expect(recoveryGoalCreateSchema.safeParse({ ...full, recoveryStatus: "failing" }).success).toBe(
      false,
    );
  });

  it("allows empty lists and a null start date", () => {
    expect(
      recoveryGoalCreateSchema.safeParse({
        ...full,
        startDate: null,
        triggers: [],
        warningSigns: [],
        copingStrategies: [],
      }).success,
    ).toBe(true);
  });
});

describe("recoveryGoalUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(recoveryGoalUpdateSchema.safeParse({}).success).toBe(true);
    expect(recoveryGoalUpdateSchema.safeParse({ recoveryStatus: "paused" }).success).toBe(true);
  });
});

describe("recoveryGoalSchema", () => {
  it("validates a stored record", () => {
    const record = recoveryGoalSchema.parse({
      id: "rg1",
      ...full,
      status: "active",
      version: 1,
      createdAt: "2026-09-08T10:00:00.000Z",
      updatedAt: "2026-09-08T10:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
      archivedAt: null,
    });
    expect(record.recoveryStatus).toBe("active");
  });
});

describe("recoveryGoalFormSchema + recoveryGoalInputFromForm", () => {
  const form: RecoveryGoalFormValues = {
    behavior: "Late-night doomscrolling",
    description: "",
    motivation: "Reclaim my mornings",
    startDate: "2026-09-01",
    triggersText: "Boredom after dinner\n\nStressful day",
    warningSignsText: "Phone in bed",
    copingStrategiesText: "Charge phone in the kitchen",
    supportNotes: "",
    faithBasedEncouragement: true,
    recoveryStatus: "challenging",
  };

  it("validates the form shape", () => {
    expect(recoveryGoalFormSchema.safeParse(form).success).toBe(true);
  });

  it("splits newline lists, drops blanks, and maps a blank start date to null", () => {
    const input = recoveryGoalInputFromForm(form);
    expect(input.triggers).toEqual(["Boredom after dinner", "Stressful day"]);
    expect(input.faithBasedEncouragement).toBe(true);
    expect(recoveryGoalCreateSchema.safeParse(input).success).toBe(true);

    const blank = recoveryGoalInputFromForm({ ...form, startDate: "" });
    expect(blank.startDate).toBeNull();
  });
});
