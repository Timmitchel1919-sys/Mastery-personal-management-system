import { describe, expect, it } from "vitest";
import {
  COPING_SUGGESTIONS,
  copingInputFromSuggestion,
  recoveryCopingActionCreateSchema,
  recoveryCopingActionSchema,
} from "./recovery-coping-schema";

const full = {
  title: "Step outside for five minutes",
  category: "physical" as const,
  howTo: "Put shoes on, walk to the corner and back.",
};

describe("recoveryCopingActionCreateSchema", () => {
  it("accepts a fully specified coping action", () => {
    expect(recoveryCopingActionCreateSchema.parse(full).category).toBe("physical");
  });

  it("requires a title and rejects an unknown category", () => {
    expect(recoveryCopingActionCreateSchema.safeParse({ ...full, title: "" }).success).toBe(false);
    expect(
      recoveryCopingActionCreateSchema.safeParse({ ...full, category: "spiritual" }).success,
    ).toBe(false);
  });

  it("allows an empty howTo", () => {
    expect(recoveryCopingActionCreateSchema.safeParse({ ...full, howTo: "" }).success).toBe(true);
  });
});

describe("recoveryCopingActionSchema", () => {
  it("validates a stored record", () => {
    const record = recoveryCopingActionSchema.parse({
      id: "a1",
      ...full,
      status: "active",
      version: 1,
      createdAt: "2026-09-05T10:00:00.000Z",
      updatedAt: "2026-09-05T10:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
      archivedAt: null,
    });
    expect(record.title).toBe(full.title);
  });
});

describe("COPING_SUGGESTIONS + copingInputFromSuggestion", () => {
  it("every suggestion is a valid create input", () => {
    for (const suggestion of COPING_SUGGESTIONS) {
      expect(
        recoveryCopingActionCreateSchema.safeParse(copingInputFromSuggestion(suggestion)).success,
      ).toBe(true);
    }
  });

  it("includes at least one faith-based option for opted-in goals", () => {
    expect(COPING_SUGGESTIONS.some((s) => s.category === "faith")).toBe(true);
  });
});
