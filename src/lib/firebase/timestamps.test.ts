import { describe, expect, it } from "vitest";
import { normalizeTimestamps } from "./timestamps";

function fakeTimestamp(iso: string) {
  const date = new Date(iso);
  return {
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
  };
}

describe("normalizeTimestamps", () => {
  it("converts a top-level Timestamp to an ISO string", () => {
    expect(normalizeTimestamps(fakeTimestamp("2026-08-27T10:00:00.000Z"))).toBe(
      "2026-08-27T10:00:00.000Z",
    );
  });

  it("converts nested Timestamps in objects and arrays", () => {
    const input = {
      title: "Goal",
      createdAt: fakeTimestamp("2026-01-01T00:00:00.000Z"),
      history: [
        { at: fakeTimestamp("2026-02-01T00:00:00.000Z"), note: "start" },
        { at: fakeTimestamp("2026-03-01T00:00:00.000Z"), note: "review" },
      ],
      meta: { updatedAt: fakeTimestamp("2026-04-01T00:00:00.000Z") },
    };

    expect(normalizeTimestamps(input)).toEqual({
      title: "Goal",
      createdAt: "2026-01-01T00:00:00.000Z",
      history: [
        { at: "2026-02-01T00:00:00.000Z", note: "start" },
        { at: "2026-03-01T00:00:00.000Z", note: "review" },
      ],
      meta: { updatedAt: "2026-04-01T00:00:00.000Z" },
    });
  });

  it("leaves primitives, null, and Date instances untouched", () => {
    expect(normalizeTimestamps("plain")).toBe("plain");
    expect(normalizeTimestamps(42)).toBe(42);
    expect(normalizeTimestamps(null)).toBeNull();
    const date = new Date("2026-05-01T00:00:00.000Z");
    expect(normalizeTimestamps({ when: date }).when).toBe(date);
  });
});
