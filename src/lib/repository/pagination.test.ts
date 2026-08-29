import { describe, expect, it } from "vitest";
import { clampLimit, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, pageQuerySchema } from "./pagination";

describe("clampLimit", () => {
  it("defaults when missing or invalid", () => {
    expect(clampLimit(undefined)).toBe(DEFAULT_PAGE_SIZE);
    expect(clampLimit(Number.NaN)).toBe(DEFAULT_PAGE_SIZE);
  });

  it("keeps a value within [1, MAX_PAGE_SIZE]", () => {
    expect(clampLimit(5)).toBe(5);
    expect(clampLimit(0)).toBe(1);
    expect(clampLimit(-10)).toBe(1);
    expect(clampLimit(9999)).toBe(MAX_PAGE_SIZE);
    expect(clampLimit(12.7)).toBe(12);
  });
});

describe("pageQuerySchema", () => {
  it("applies the default limit and caps the max", () => {
    expect(pageQuerySchema.parse({}).limit).toBe(DEFAULT_PAGE_SIZE);
    expect(pageQuerySchema.safeParse({ limit: MAX_PAGE_SIZE + 1 }).success).toBe(false);
    expect(pageQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
  });

  it("accepts an optional cursor and ordering", () => {
    const parsed = pageQuerySchema.parse({ cursor: "abc", orderBy: "createdAt", direction: "asc" });
    expect(parsed).toMatchObject({ cursor: "abc", orderBy: "createdAt", direction: "asc" });
    expect(pageQuerySchema.safeParse({ direction: "sideways" }).success).toBe(false);
  });
});
