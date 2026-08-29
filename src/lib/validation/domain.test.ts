import { describe, expect, it } from "vitest";
import {
  lifePillarSchema,
  lifePillarsSchema,
  measurementTypeSchema,
  prioritySchema,
  recordStatusSchema,
} from "./domain";

describe("domain primitives", () => {
  it("accepts the three life pillars and rejects others", () => {
    expect(lifePillarSchema.parse("spiritual")).toBe("spiritual");
    expect(lifePillarSchema.safeParse("financial").success).toBe(false);
  });

  it("requires at least one pillar in a pillar list", () => {
    expect(lifePillarsSchema.safeParse(["personal", "societal"]).success).toBe(true);
    expect(lifePillarsSchema.safeParse([]).success).toBe(false);
    expect(
      lifePillarsSchema.safeParse(["spiritual", "personal", "societal", "spiritual"]).success,
    ).toBe(false);
  });

  it("validates priority, status, and measurement enums", () => {
    expect(prioritySchema.safeParse("critical").success).toBe(true);
    expect(prioritySchema.safeParse("urgent").success).toBe(false);
    expect(recordStatusSchema.parse("archived")).toBe("archived");
    expect(measurementTypeSchema.safeParse("duration").success).toBe(true);
  });
});
