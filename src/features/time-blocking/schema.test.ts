import { describe, expect, it } from "vitest";
import {
  blockDurationMinutes,
  timeBlockCreateSchema,
  timeBlockFormSchema,
  timeBlockInputFromForm,
  timeBlockSchema,
  timeBlockUpdateSchema,
  type TimeBlockFormValues,
} from "./schema";

const full = {
  title: "Morning deep work",
  category: "deep-work" as const,
  timeZone: "Europe/Amsterdam",
  startDateTime: "2026-09-02T09:00:00+02:00",
  endDateTime: "2026-09-02T10:30:00+02:00",
  pillarIds: ["personal" as const],
  goalId: null,
  projectId: null,
  notes: "",
  blockStatus: "planned" as const,
};

describe("timeBlockCreateSchema", () => {
  it("accepts a fully specified block", () => {
    expect(timeBlockCreateSchema.parse(full).title).toBe("Morning deep work");
  });

  it("requires the core fields", () => {
    expect(timeBlockCreateSchema.safeParse({ title: "x" }).success).toBe(false);
  });

  it("rejects an unknown category or status", () => {
    expect(timeBlockCreateSchema.safeParse({ ...full, category: "sleep" }).success).toBe(false);
    expect(timeBlockCreateSchema.safeParse({ ...full, blockStatus: "pending" }).success).toBe(
      false,
    );
  });

  it("rejects an end at or before the start", () => {
    expect(
      timeBlockCreateSchema.safeParse({
        ...full,
        endDateTime: "2026-09-02T09:00:00+02:00",
      }).success,
    ).toBe(false);
    expect(
      timeBlockCreateSchema.safeParse({
        ...full,
        endDateTime: "2026-09-02T08:00:00+02:00",
      }).success,
    ).toBe(false);
  });

  it("caps pillars at three", () => {
    expect(
      timeBlockCreateSchema.safeParse({
        ...full,
        pillarIds: ["spiritual", "personal", "societal", "personal"],
      }).success,
    ).toBe(false);
  });

  it("allows an empty pillar list", () => {
    expect(timeBlockCreateSchema.safeParse({ ...full, pillarIds: [] }).success).toBe(true);
  });
});

describe("timeBlockUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(timeBlockUpdateSchema.safeParse({}).success).toBe(true);
    expect(timeBlockUpdateSchema.safeParse({ blockStatus: "done" }).success).toBe(true);
    expect(timeBlockUpdateSchema.safeParse({ category: "nope" }).success).toBe(false);
  });
});

describe("timeBlockFormSchema + timeBlockInputFromForm", () => {
  const form: TimeBlockFormValues = {
    title: "Study session",
    category: "learning",
    timeZone: "Europe/Amsterdam",
    startWall: "2026-09-02T09:00",
    endWall: "2026-09-02T10:30",
    pillarIds: ["personal"],
    goalId: "",
    projectId: "project-1",
    notes: "",
    blockStatus: "planned",
  };

  it("rejects an end wall time at or before the start", () => {
    expect(timeBlockFormSchema.safeParse({ ...form, endWall: "2026-09-02T09:00" }).success).toBe(
      false,
    );
  });

  it("converts wall times to zoned ISO instants and maps a blank goal to null", () => {
    const input = timeBlockInputFromForm(form);
    expect(input.startDateTime).toBe("2026-09-02T09:00:00+02:00");
    expect(input.endDateTime).toBe("2026-09-02T10:30:00+02:00");
    expect(input.goalId).toBeNull();
    expect(input.projectId).toBe("project-1");
    expect(timeBlockCreateSchema.safeParse(input).success).toBe(true);
  });
});

describe("blockDurationMinutes", () => {
  it("returns whole minutes between the instants", () => {
    expect(blockDurationMinutes(full)).toBe(90);
  });
});

describe("timeBlockSchema", () => {
  it("validates a stored record", () => {
    const record = timeBlockSchema.parse({
      id: "tb1",
      ...full,
      status: "active",
      version: 1,
      createdAt: "2026-09-02T07:00:00.000Z",
      updatedAt: "2026-09-02T07:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
    });
    expect(record.category).toBe("deep-work");
  });
});
