import { describe, expect, it } from "vitest";
import { isoDateTimeSchema, nonEmptyString, paginationQuerySchema } from "./index";

describe("shared validation", () => {
  it("nonEmptyString trims and rejects blank input", () => {
    expect(nonEmptyString.parse("  hello  ")).toBe("hello");
    expect(nonEmptyString.safeParse("   ").success).toBe(false);
  });

  it("isoDateTimeSchema accepts ISO strings and rejects garbage", () => {
    expect(isoDateTimeSchema.safeParse("2026-08-27T10:00:00.000Z").success).toBe(true);
    expect(isoDateTimeSchema.safeParse("not-a-date").success).toBe(false);
  });

  it("paginationQuerySchema applies a default limit and caps the maximum", () => {
    expect(paginationQuerySchema.parse({}).limit).toBe(20);
    expect(paginationQuerySchema.safeParse({ limit: 500 }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
  });
});
