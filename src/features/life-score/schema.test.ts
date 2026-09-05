import { describe, expect, it } from "vitest";
import {
  lifeScoreEntryCreateSchema,
  lifeScoreEntryInputFromResult,
  lifeScoreEntrySchema,
  saveScoreFormSchema,
  type LifeScoreFactor,
} from "./schema";

const factors: LifeScoreFactor[] = [
  { kpiId: "k1", title: "Sleep", value: 8, attainment: 100, weight: 3 },
];

describe("lifeScoreEntryCreateSchema", () => {
  it("accepts a fully specified entry", () => {
    const entry = lifeScoreEntryCreateSchema.parse({
      date: "2026-09-02",
      score: 75,
      factors,
      note: "",
    });
    expect(entry.score).toBe(75);
  });

  it("rejects a score outside 0-100", () => {
    expect(
      lifeScoreEntryCreateSchema.safeParse({ date: "2026-09-02", score: 150, factors, note: "" })
        .success,
    ).toBe(false);
  });
});

describe("lifeScoreEntrySchema", () => {
  it("validates a stored record", () => {
    const record = lifeScoreEntrySchema.parse({
      id: "ls1",
      date: "2026-09-02",
      score: 75,
      factors,
      note: "",
      status: "active",
      version: 1,
      createdAt: "2026-09-02T10:00:00.000Z",
      updatedAt: "2026-09-02T10:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
      archivedAt: null,
    });
    expect(record.factors[0]?.kpiId).toBe("k1");
  });
});

describe("saveScoreFormSchema + lifeScoreEntryInputFromResult", () => {
  it("validates an optional note", () => {
    expect(saveScoreFormSchema.safeParse({ note: "" }).success).toBe(true);
  });

  it("builds a create payload from a computed score", () => {
    const input = lifeScoreEntryInputFromResult(75, factors, "2026-09-02", "Felt good today");
    expect(input).toEqual({ date: "2026-09-02", score: 75, factors, note: "Felt good today" });
    expect(lifeScoreEntryCreateSchema.safeParse(input).success).toBe(true);
  });
});
