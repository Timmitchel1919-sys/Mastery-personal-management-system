import { describe, expect, it } from "vitest";
import {
  recoveryRelapseFormSchema,
  recoveryRelapseRequestFromForm,
  recoveryRelapseRequestSchema,
  recoveryRelapseResultSchema,
  recoveryRelapseSchema,
} from "./recovery-relapse-schema";

const stored = {
  id: "r1",
  date: "2026-09-08",
  whatHappened: "Scrolled for two hours after a stressful call.",
  contributingFactors: ["Stress"],
  lessonsLearned: "Move the phone away when stressed.",
  restartPlan: "Charge it in the kitchen tonight.",
  status: "active",
  version: 1,
  createdAt: "2026-09-08T10:00:00.000Z",
  updatedAt: "2026-09-08T10:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
};

describe("recoveryRelapseSchema", () => {
  it("validates a stored record and requires whatHappened", () => {
    expect(recoveryRelapseSchema.parse(stored).date).toBe("2026-09-08");
    expect(recoveryRelapseSchema.safeParse({ ...stored, whatHappened: "" }).success).toBe(false);
  });
});

describe("recoveryRelapseRequestSchema + recoveryRelapseResultSchema", () => {
  it("validates the callable request and result shapes", () => {
    expect(
      recoveryRelapseRequestSchema.safeParse({
        goalId: "g1",
        date: "2026-09-08",
        whatHappened: "A hard day.",
        contributingFactors: [],
        lessonsLearned: "",
        restartPlan: "",
      }).success,
    ).toBe(true);
    expect(recoveryRelapseResultSchema.safeParse({ relapseId: "r1" }).success).toBe(true);
    expect(recoveryRelapseResultSchema.safeParse({ relapseId: "" }).success).toBe(false);
  });
});

describe("recoveryRelapseFormSchema + recoveryRelapseRequestFromForm", () => {
  it("attaches the goalId and splits contributing factors", () => {
    const request = recoveryRelapseRequestFromForm("g1", {
      date: "2026-09-08",
      whatHappened: "A hard day.",
      contributingFactorsText: "Stress\n\nTired",
      lessonsLearned: "",
      restartPlan: "Small step tomorrow",
    });
    expect(request).toEqual({
      goalId: "g1",
      date: "2026-09-08",
      whatHappened: "A hard day.",
      contributingFactors: ["Stress", "Tired"],
      lessonsLearned: "",
      restartPlan: "Small step tomorrow",
    });
    expect(recoveryRelapseRequestSchema.safeParse(request).success).toBe(true);
  });

  it("requires a non-empty whatHappened in the form", () => {
    expect(
      recoveryRelapseFormSchema.safeParse({
        date: "2026-09-08",
        whatHappened: "",
        contributingFactorsText: "",
        lessonsLearned: "",
        restartPlan: "",
      }).success,
    ).toBe(false);
  });
});
