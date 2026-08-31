import { describe, expect, it } from "vitest";
import {
  dayKey,
  layoutDay,
  monthMatrix,
  navigate,
  occurrencesByDay,
  periodLabel,
  startOfWeek,
  weekDates,
} from "./calendar-range";
import type { EventOccurrence } from "./recurrence";

// Local-time occurrences so day bucketing / positioning is compared in the runner's zone.
function occ(id: string, start: Date, end: Date, allDay = false): EventOccurrence {
  return {
    key: `${id}:${start.toISOString()}`,
    // Only the fields the range helpers read.
    event: { id, title: id, timeZone: "UTC" } as EventOccurrence["event"],
    start,
    end,
    allDay,
    recurring: false,
  };
}
const at = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m, d, h, min);

describe("startOfWeek", () => {
  it("anchors to Monday", () => {
    // 2026-09-09 is a Wednesday.
    expect(dayKey(startOfWeek(new Date(2026, 8, 9)))).toBe("2026-09-07");
    // A Monday maps to itself.
    expect(dayKey(startOfWeek(new Date(2026, 8, 7)))).toBe("2026-09-07");
  });
});

describe("monthMatrix", () => {
  it("is a 6×7 grid starting on the Monday on/before the 1st", () => {
    const grid = monthMatrix(new Date(2026, 8, 15)); // September 2026, 1st is a Tuesday
    expect(grid).toHaveLength(6);
    expect(grid[0]).toHaveLength(7);
    expect(dayKey(grid[0]![0]!)).toBe("2026-08-31");
    expect(dayKey(grid[5]![6]!)).toBe("2026-10-11");
  });
});

describe("weekDates", () => {
  it("returns Monday…Sunday", () => {
    const days = weekDates(new Date(2026, 8, 9));
    expect(days.map(dayKey)).toEqual([
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
    ]);
  });
});

describe("periodLabel", () => {
  it("labels each view", () => {
    const anchor = new Date(2026, 8, 9);
    expect(periodLabel("month", anchor)).toBe("September 2026");
    expect(periodLabel("day", anchor)).toBe("September 9, 2026");
    expect(periodLabel("week", anchor)).toBe("Sep 7 – 13, 2026");
  });
});

describe("navigate", () => {
  it("moves by the view unit", () => {
    const anchor = new Date(2026, 8, 15);
    expect(dayKey(navigate("day", anchor, 1))).toBe("2026-09-16");
    expect(dayKey(navigate("week", anchor, -1))).toBe("2026-09-08");
    expect(navigate("month", anchor, 1).getMonth()).toBe(9);
  });
});

describe("occurrencesByDay", () => {
  it("buckets a multi-day occurrence into every day it spans", () => {
    const days = weekDates(new Date(2026, 8, 9));
    const map = occurrencesByDay([occ("x", at(2026, 8, 8, 12), at(2026, 8, 10, 12))], days);
    expect(map.get("2026-09-08")).toHaveLength(1);
    expect(map.get("2026-09-09")).toHaveLength(1);
    expect(map.get("2026-09-10")).toHaveLength(1);
    expect(map.get("2026-09-11")).toHaveLength(0);
    expect(map.get("2026-09-07")).toHaveLength(0);
  });
});

describe("layoutDay", () => {
  it("keeps non-overlapping events in one column", () => {
    const day = at(2026, 8, 9);
    const positioned = layoutDay(
      [
        occ("a", at(2026, 8, 9, 9), at(2026, 8, 9, 10)),
        occ("b", at(2026, 8, 9, 11), at(2026, 8, 9, 12)),
      ],
      day,
    );
    expect(positioned.every((p) => p.columns === 1 && p.column === 0)).toBe(true);
  });

  it("splits overlapping events into side-by-side columns", () => {
    const day = at(2026, 8, 9);
    const positioned = layoutDay(
      [
        occ("a", at(2026, 8, 9, 9), at(2026, 8, 9, 11)),
        occ("b", at(2026, 8, 9, 10), at(2026, 8, 9, 12)),
      ],
      day,
    );
    expect(positioned).toHaveLength(2);
    expect(positioned.map((p) => p.column).sort()).toEqual([0, 1]);
    expect(positioned.every((p) => p.columns === 2)).toBe(true);
  });

  it("ignores all-day occurrences", () => {
    const day = at(2026, 8, 9);
    expect(layoutDay([occ("a", at(2026, 8, 9), at(2026, 8, 10), true)], day)).toHaveLength(0);
  });
});
