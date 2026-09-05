import { describe, expect, it } from "vitest";
import {
  EMPTY_HALT,
  recoveryCheckInCreateSchema,
  recoveryCheckInFormSchema,
  recoveryCheckInInputFromForm,
  recoveryCheckInSchema,
  type RecoveryCheckInFormValues,
} from "./recovery-checkin-schema";

const full = {
  date: "2026-09-08",
  stayedOnTrack: true,
  urgeIntensity: 3,
  halt: { hungry: false, angry: true, lonely: false, tired: true },
  triggersToday: ["Boredom"],
  copingUsed: ["Went for a walk"],
  reflection: "Better than yesterday",
};

describe("recoveryCheckInCreateSchema", () => {
  it("accepts a fully specified check-in", () => {
    expect(recoveryCheckInCreateSchema.parse(full).urgeIntensity).toBe(3);
  });

  it("rejects an urge outside 0-10 and a non-boolean halt entry", () => {
    expect(recoveryCheckInCreateSchema.safeParse({ ...full, urgeIntensity: 11 }).success).toBe(
      false,
    );
    expect(
      recoveryCheckInCreateSchema.safeParse({ ...full, halt: { ...full.halt, hungry: "yes" } })
        .success,
    ).toBe(false);
  });

  it("allows empty lists and EMPTY_HALT", () => {
    expect(
      recoveryCheckInCreateSchema.safeParse({
        ...full,
        halt: EMPTY_HALT,
        triggersToday: [],
        copingUsed: [],
        reflection: "",
      }).success,
    ).toBe(true);
  });
});

describe("recoveryCheckInSchema", () => {
  it("validates a stored record", () => {
    const record = recoveryCheckInSchema.parse({
      id: "c1",
      ...full,
      status: "active",
      version: 1,
      createdAt: "2026-09-08T10:00:00.000Z",
      updatedAt: "2026-09-08T10:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
      archivedAt: null,
    });
    expect(record.halt.angry).toBe(true);
  });
});

describe("recoveryCheckInFormSchema + recoveryCheckInInputFromForm", () => {
  const form: RecoveryCheckInFormValues = {
    date: "2026-09-08",
    stayedOnTrack: false,
    urgeIntensity: 7,
    halt: { hungry: true, angry: false, lonely: true, tired: false },
    triggersTodayText: "Boredom\n\nStress",
    copingUsedText: "Walk",
    reflection: "",
  };

  it("validates and splits the newline lists", () => {
    expect(recoveryCheckInFormSchema.safeParse(form).success).toBe(true);
    const input = recoveryCheckInInputFromForm(form);
    expect(input.triggersToday).toEqual(["Boredom", "Stress"]);
    expect(input.stayedOnTrack).toBe(false);
    expect(recoveryCheckInCreateSchema.safeParse(input).success).toBe(true);
  });
});
