import { describe, expect, it } from "vitest";
import { formatToday, greetingForHour, greetingText } from "./dashboard-aggregate";

describe("greetingForHour", () => {
  it("splits the day into morning / afternoon / evening", () => {
    expect(greetingForHour(0)).toBe("morning");
    expect(greetingForHour(11)).toBe("morning");
    expect(greetingForHour(12)).toBe("afternoon");
    expect(greetingForHour(17)).toBe("afternoon");
    expect(greetingForHour(18)).toBe("evening");
    expect(greetingForHour(23)).toBe("evening");
  });
});

describe("greetingText", () => {
  it("maps to a friendly phrase", () => {
    expect(greetingText("morning")).toBe("Good morning");
    expect(greetingText("evening")).toBe("Good evening");
  });
});

describe("formatToday", () => {
  const date = new Date("2026-08-28T09:00:00.000Z");

  it("formats a locale- and timezone-aware date", () => {
    const label = formatToday(date, "en-US", "UTC");
    expect(label).toMatch(/friday/i);
    expect(label).toMatch(/august/i);
  });

  it("falls back gracefully on a bad locale or timezone", () => {
    expect(() => formatToday(date, "en", "Not/AZone")).not.toThrow();
    expect(formatToday(date, "en", "Not/AZone")).toMatch(/friday/i);
  });
});
