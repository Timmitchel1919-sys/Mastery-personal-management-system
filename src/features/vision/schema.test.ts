import { describe, expect, it } from "vitest";
import {
  LIFE_VISION_CATEGORIES,
  LIFE_VISION_CATEGORY_META,
  lifeVisionCreateSchema,
  lifeVisionSchema,
  lifeVisionUpdateSchema,
} from "./schema";

const audit = {
  createdAt: "2026-08-28T00:00:00.000Z",
  updatedAt: "2026-08-28T00:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
};

describe("lifeVisionCreateSchema", () => {
  it("accepts a well-formed vision item", () => {
    const parsed = lifeVisionCreateSchema.parse({
      category: "mission",
      title: "  Serve well  ",
      content: "Be useful to the people around me.",
      pillarIds: ["spiritual", "personal"],
    });
    expect(parsed.title).toBe("Serve well");
    expect(parsed.pillarIds).toEqual(["spiritual", "personal"]);
  });

  it("rejects an unknown category", () => {
    expect(
      lifeVisionCreateSchema.safeParse({
        category: "career",
        title: "x",
        content: "y",
        pillarIds: ["personal"],
      }).success,
    ).toBe(false);
  });

  it("requires between one and three pillars", () => {
    const base = { category: "values", title: "Honesty", content: "Always" };
    expect(lifeVisionCreateSchema.safeParse({ ...base, pillarIds: [] }).success).toBe(false);
    expect(
      lifeVisionCreateSchema.safeParse({
        ...base,
        pillarIds: ["spiritual", "personal", "societal", "personal"],
      }).success,
    ).toBe(false);
    expect(lifeVisionCreateSchema.safeParse({ ...base, pillarIds: ["personal"] }).success).toBe(
      true,
    );
  });

  it("enforces title and content limits", () => {
    const base = { category: "principle", pillarIds: ["personal"] };
    expect(lifeVisionCreateSchema.safeParse({ ...base, title: "", content: "x" }).success).toBe(
      false,
    );
    expect(
      lifeVisionCreateSchema.safeParse({ ...base, title: "t", content: "x".repeat(4001) }).success,
    ).toBe(false);
  });
});

describe("lifeVisionUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(lifeVisionUpdateSchema.safeParse({}).success).toBe(true);
    expect(lifeVisionUpdateSchema.safeParse({ title: "New title" }).success).toBe(true);
  });
});

describe("lifeVisionSchema", () => {
  it("is a full audited record", () => {
    const record = lifeVisionSchema.parse({
      id: "v1",
      category: "future-self",
      title: "Calm and consistent",
      content: "…",
      pillarIds: ["personal"],
      ...audit,
    });
    expect(record.status).toBe("active");
    expect(record.version).toBe(1);
  });
});

describe("category metadata", () => {
  it("covers every category with sane defaults", () => {
    for (const category of LIFE_VISION_CATEGORIES) {
      const meta = LIFE_VISION_CATEGORY_META[category];
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.defaultPillars.length).toBeGreaterThanOrEqual(1);
      expect(meta.defaultPillars.length).toBeLessThanOrEqual(3);
    }
  });
});
