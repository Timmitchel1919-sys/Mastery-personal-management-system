import { describe, expect, it } from "vitest";
import {
  instantToWall,
  isoToWall,
  wallTimeToInstant,
  wallTimeToIso,
  zoneOffsetMinutes,
} from "./zoned-time";

describe("zoneOffsetMinutes", () => {
  it("is constant for a zone without DST", () => {
    expect(zoneOffsetMinutes(new Date("2026-01-15T12:00:00Z"), "Asia/Tokyo")).toBe(540);
    expect(zoneOffsetMinutes(new Date("2026-07-15T12:00:00Z"), "Asia/Tokyo")).toBe(540);
  });

  it("tracks DST for a zone that observes it", () => {
    expect(zoneOffsetMinutes(new Date("2026-01-15T12:00:00Z"), "America/New_York")).toBe(-300);
    expect(zoneOffsetMinutes(new Date("2026-07-15T12:00:00Z"), "America/New_York")).toBe(-240);
  });
});

describe("wall ↔ instant", () => {
  it("converts a summer wall time to the right UTC instant", () => {
    expect(wallTimeToInstant("2026-07-15T09:00", "America/New_York").toISOString()).toBe(
      "2026-07-15T13:00:00.000Z",
    );
  });

  it("converts a winter wall time to the right UTC instant", () => {
    expect(wallTimeToInstant("2026-01-15T09:00", "America/New_York").toISOString()).toBe(
      "2026-01-15T14:00:00.000Z",
    );
  });

  it("renders an instant back as the zone's wall clock", () => {
    expect(instantToWall(new Date("2026-07-15T13:00:00Z"), "America/New_York")).toEqual({
      date: "2026-07-15",
      time: "09:00",
    });
  });
});

describe("wallTimeToIso / isoToWall", () => {
  it("stamps the correct offset for the date", () => {
    expect(wallTimeToIso("2026-07-15T09:00", "America/New_York")).toBe("2026-07-15T09:00:00-04:00");
    expect(wallTimeToIso("2026-01-15T09:00", "America/New_York")).toBe("2026-01-15T09:00:00-05:00");
    expect(wallTimeToIso("2026-03-01T08:30", "Asia/Tokyo")).toBe("2026-03-01T08:30:00+09:00");
  });

  it("round-trips through isoToWall", () => {
    const iso = wallTimeToIso("2026-09-01T14:15", "Europe/Amsterdam");
    expect(isoToWall(iso, "Europe/Amsterdam")).toEqual({ date: "2026-09-01", time: "14:15" });
  });

  it("returns empty for a malformed wall string", () => {
    expect(wallTimeToIso("not-a-date", "UTC")).toBe("");
  });
});
