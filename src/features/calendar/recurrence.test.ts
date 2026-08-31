import { describe, expect, it } from "vitest";
import { expandEvent, expandEvents } from "./recurrence";
import type { CalendarEvent, Recurrence } from "./schema";

const audit = {
  status: "active" as const,
  version: 1,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
};

function timed(
  id: string,
  startIso: string,
  endIso: string,
  recurrence: Recurrence | null = null,
): CalendarEvent {
  return {
    id,
    ...audit,
    title: id,
    description: "",
    location: "",
    allDay: false,
    timeZone: "UTC",
    startDateTime: startIso,
    endDateTime: endIso,
    startDate: null,
    endDate: null,
    recurrence,
    reminders: [],
    goalId: null,
    projectId: null,
  };
}

function allDay(
  id: string,
  start: string,
  end: string,
  recurrence: Recurrence | null = null,
): CalendarEvent {
  return {
    ...timed(id, "2026-01-01T00:00:00Z", "2026-01-01T00:00:00Z", recurrence),
    allDay: true,
    startDateTime: null,
    endDateTime: null,
    startDate: start,
    endDate: end,
  };
}

const rule = (over: Partial<Recurrence> = {}): Recurrence => ({
  frequency: "daily",
  interval: 1,
  weekdays: [],
  count: null,
  until: null,
  ...over,
});

describe("expandEvent — non-recurring", () => {
  it("yields one occurrence when it overlaps the range", () => {
    const event = timed("e", "2026-09-10T09:00:00Z", "2026-09-10T10:00:00Z");
    const occ = expandEvent(
      event,
      new Date("2026-09-01T00:00:00Z"),
      new Date("2026-10-01T00:00:00Z"),
    );
    expect(occ).toHaveLength(1);
    expect(occ[0]?.recurring).toBe(false);
  });

  it("yields nothing when it is outside the range", () => {
    const event = timed("e", "2026-09-10T09:00:00Z", "2026-09-10T10:00:00Z");
    expect(
      expandEvent(event, new Date("2026-10-01T00:00:00Z"), new Date("2026-11-01T00:00:00Z")),
    ).toHaveLength(0);
  });
});

describe("expandEvent — recurring", () => {
  it("daily with a count stops after N occurrences", () => {
    const event = timed(
      "d",
      "2026-09-01T09:00:00Z",
      "2026-09-01T09:30:00Z",
      rule({ frequency: "daily", count: 3 }),
    );
    const occ = expandEvent(
      event,
      new Date("2026-09-01T00:00:00Z"),
      new Date("2026-12-01T00:00:00Z"),
    );
    expect(occ.map((o) => o.start.toISOString())).toEqual([
      "2026-09-01T09:00:00.000Z",
      "2026-09-02T09:00:00.000Z",
      "2026-09-03T09:00:00.000Z",
    ]);
  });

  it("daily with an interval skips days", () => {
    const event = timed(
      "d",
      "2026-09-01T09:00:00Z",
      "2026-09-01T09:30:00Z",
      rule({ interval: 2, until: "2026-09-07" }),
    );
    const occ = expandEvent(
      event,
      new Date("2026-09-01T00:00:00Z"),
      new Date("2026-10-01T00:00:00Z"),
    );
    expect(occ.map((o) => o.start.toISOString().slice(0, 10))).toEqual([
      "2026-09-01",
      "2026-09-03",
      "2026-09-05",
      "2026-09-07",
    ]);
  });

  it("weekly on selected weekdays", () => {
    // 2026-09-07 is a Monday.
    const event = timed(
      "w",
      "2026-09-07T08:00:00Z",
      "2026-09-07T09:00:00Z",
      rule({ frequency: "weekly", weekdays: [1, 3], count: 4 }), // Mon + Wed
    );
    const occ = expandEvent(
      event,
      new Date("2026-09-01T00:00:00Z"),
      new Date("2026-10-01T00:00:00Z"),
    );
    expect(occ.map((o) => o.start.toISOString().slice(0, 10))).toEqual([
      "2026-09-07",
      "2026-09-09",
      "2026-09-14",
      "2026-09-16",
    ]);
  });

  it("monthly skips months without the start day", () => {
    const event = timed(
      "m",
      "2026-01-31T12:00:00Z",
      "2026-01-31T13:00:00Z",
      rule({ frequency: "monthly", until: "2026-05-31" }),
    );
    const occ = expandEvent(
      event,
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-07-01T00:00:00Z"),
    );
    // Feb, Apr have no 31st → skipped.
    expect(occ.map((o) => o.start.toISOString().slice(0, 10))).toEqual([
      "2026-01-31",
      "2026-03-31",
      "2026-05-31",
    ]);
  });

  it("clips a long recurring series to the requested window", () => {
    const event = timed("d", "2026-01-01T09:00:00Z", "2026-01-01T10:00:00Z", rule());
    const occ = expandEvent(
      event,
      new Date("2026-06-10T00:00:00Z"),
      new Date("2026-06-13T00:00:00Z"),
    );
    expect(occ.map((o) => o.start.toISOString().slice(0, 10))).toEqual([
      "2026-06-10",
      "2026-06-11",
      "2026-06-12",
    ]);
  });

  it("expands an all-day recurring event", () => {
    const event = allDay("a", "2026-09-01", "2026-09-01", rule({ frequency: "weekly", count: 3 }));
    const occ = expandEvent(
      event,
      new Date("2026-09-01T00:00:00Z"),
      new Date("2026-10-01T00:00:00Z"),
    );
    expect(occ).toHaveLength(3);
    expect(occ[0]?.allDay).toBe(true);
  });
});

describe("expandEvents", () => {
  it("merges and sorts occurrences from several events by start", () => {
    const a = timed("a", "2026-09-02T09:00:00Z", "2026-09-02T10:00:00Z");
    const b = timed("b", "2026-09-01T09:00:00Z", "2026-09-01T10:00:00Z");
    const merged = expandEvents(
      [a, b],
      new Date("2026-09-01T00:00:00Z"),
      new Date("2026-09-30T00:00:00Z"),
    );
    expect(merged.map((o) => o.event.id)).toEqual(["b", "a"]);
  });
});
