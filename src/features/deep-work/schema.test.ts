import { describe, expect, it } from "vitest";
import {
  deepWorkCreateSchema,
  deepWorkFormSchema,
  deepWorkInputFromForm,
  deepWorkSessionSchema,
  deepWorkUpdateSchema,
  type DeepWorkFormValues,
} from "./schema";

const full = {
  title: "Draft the spec",
  intendedOutcome: "A complete first draft.",
  goalId: null,
  projectId: null,
  plannedMinutes: 90,
  startedAt: "2026-08-31T09:00",
  endedAt: "2026-08-31T10:30",
  actualMinutes: 85,
  energyLevel: 4,
  focusQuality: 4,
  distractions: ["Slack ping"],
  completionNotes: "",
  sessionStatus: "completed" as const,
};

describe("deepWorkCreateSchema", () => {
  it("accepts a fully specified session", () => {
    expect(deepWorkCreateSchema.parse(full).title).toBe("Draft the spec");
  });

  it("requires the core fields", () => {
    expect(deepWorkCreateSchema.safeParse({ title: "x" }).success).toBe(false);
  });

  it("keeps ratings within 1–5 and minutes in range", () => {
    expect(deepWorkCreateSchema.safeParse({ ...full, energyLevel: 0 }).success).toBe(false);
    expect(deepWorkCreateSchema.safeParse({ ...full, focusQuality: 6 }).success).toBe(false);
    expect(deepWorkCreateSchema.safeParse({ ...full, plannedMinutes: 0 }).success).toBe(false);
    expect(deepWorkCreateSchema.safeParse({ ...full, actualMinutes: 999 }).success).toBe(false);
  });

  it("rejects an end time before the start time", () => {
    expect(
      deepWorkCreateSchema.safeParse({
        ...full,
        startedAt: "2026-08-31T10:30",
        endedAt: "2026-08-31T09:00",
      }).success,
    ).toBe(false);
  });

  it("allows null timestamps", () => {
    expect(
      deepWorkCreateSchema.safeParse({ ...full, startedAt: null, endedAt: null }).success,
    ).toBe(true);
  });

  it("caps the distraction log at 50 entries and 4 statuses", () => {
    expect(
      deepWorkCreateSchema.safeParse({
        ...full,
        distractions: Array.from({ length: 51 }, (_, i) => `d${i}`),
      }).success,
    ).toBe(false);
    expect(deepWorkCreateSchema.safeParse({ ...full, sessionStatus: "paused" }).success).toBe(
      false,
    );
  });
});

describe("deepWorkUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(deepWorkUpdateSchema.safeParse({}).success).toBe(true);
    expect(
      deepWorkUpdateSchema.safeParse({ focusQuality: 5, sessionStatus: "completed" }).success,
    ).toBe(true);
    expect(deepWorkUpdateSchema.safeParse({ energyLevel: 9 }).success).toBe(false);
  });
});

describe("deepWorkFormSchema + deepWorkInputFromForm", () => {
  const form: DeepWorkFormValues = {
    title: "Review PRs",
    intendedOutcome: "",
    goalId: "",
    projectId: "project-1",
    plannedMinutes: 60,
    startedAt: "2026-08-31T14:00",
    endedAt: "2026-08-31T15:00",
    actualMinutes: 0,
    energyLevel: 3,
    focusQuality: 3,
    distractions: [],
    completionNotes: "",
    sessionStatus: "completed",
  };

  it("accepts empty datetime strings", () => {
    expect(deepWorkFormSchema.safeParse({ ...form, startedAt: "", endedAt: "" }).success).toBe(
      true,
    );
  });

  it("derives actual minutes from start/end when left at 0", () => {
    const input = deepWorkInputFromForm(form);
    expect(input.actualMinutes).toBe(60);
    expect(input.goalId).toBeNull();
    expect(input.projectId).toBe("project-1");
    expect(deepWorkCreateSchema.safeParse(input).success).toBe(true);
  });

  it("keeps an explicit actual-minutes value", () => {
    expect(deepWorkInputFromForm({ ...form, actualMinutes: 42 }).actualMinutes).toBe(42);
  });
});

describe("deepWorkSessionSchema", () => {
  it("validates a stored record", () => {
    const record = deepWorkSessionSchema.parse({
      id: "d1",
      ...full,
      status: "active",
      version: 1,
      createdAt: "2026-08-31T10:30:00.000Z",
      updatedAt: "2026-08-31T10:30:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
    });
    expect(record.sessionStatus).toBe("completed");
  });
});
