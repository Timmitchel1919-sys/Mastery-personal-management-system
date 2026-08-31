import { describe, expect, it } from "vitest";
import {
  eventCreateSchema,
  eventFormSchema,
  eventInputFromForm,
  eventSchema,
  eventUpdateSchema,
  type CalendarEventFormValues,
} from "./schema";

const timedEvent = {
  title: "Team sync",
  description: "",
  location: "",
  allDay: false,
  timeZone: "Europe/Amsterdam",
  startDateTime: "2026-09-01T09:00:00+02:00",
  endDateTime: "2026-09-01T09:30:00+02:00",
  startDate: null,
  endDate: null,
  recurrence: null,
  reminders: [10],
  goalId: null,
  projectId: null,
};

const allDayEvent = {
  ...timedEvent,
  allDay: true,
  startDateTime: null,
  endDateTime: null,
  startDate: "2026-09-01",
  endDate: "2026-09-01",
};

describe("eventCreateSchema", () => {
  it("accepts a timed event and an all-day event", () => {
    expect(eventCreateSchema.safeParse(timedEvent).success).toBe(true);
    expect(eventCreateSchema.safeParse(allDayEvent).success).toBe(true);
  });

  it("rejects a timed event that carries all-day dates (and vice versa)", () => {
    expect(eventCreateSchema.safeParse({ ...timedEvent, startDate: "2026-09-01" }).success).toBe(
      false,
    );
    expect(
      eventCreateSchema.safeParse({ ...allDayEvent, startDateTime: "2026-09-01T09:00:00Z" })
        .success,
    ).toBe(false);
  });

  it("rejects an end before the start", () => {
    expect(
      eventCreateSchema.safeParse({
        ...timedEvent,
        startDateTime: "2026-09-01T10:00:00+02:00",
        endDateTime: "2026-09-01T09:00:00+02:00",
      }).success,
    ).toBe(false);
  });

  it("validates the recurrence rule and reminder bounds", () => {
    expect(
      eventCreateSchema.safeParse({
        ...timedEvent,
        recurrence: { frequency: "weekly", interval: 2, weekdays: [1, 3], count: 10, until: null },
      }).success,
    ).toBe(true);
    expect(
      eventCreateSchema.safeParse({
        ...timedEvent,
        recurrence: { frequency: "weekly", interval: 0, weekdays: [], count: null, until: null },
      }).success,
    ).toBe(false);
    expect(
      eventCreateSchema.safeParse({ ...timedEvent, reminders: [1, 2, 3, 4, 5, 6] }).success,
    ).toBe(false);
  });
});

describe("eventUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(eventUpdateSchema.safeParse({}).success).toBe(true);
    expect(eventUpdateSchema.safeParse({ title: "Renamed" }).success).toBe(true);
    expect(eventUpdateSchema.safeParse({ title: "" }).success).toBe(false);
  });
});

describe("eventFormSchema + eventInputFromForm", () => {
  const timedForm: CalendarEventFormValues = {
    title: "Focus block",
    description: "",
    location: "",
    allDay: false,
    timeZone: "America/New_York",
    startWall: "2026-07-15T09:00",
    endWall: "2026-07-15T11:00",
    startDate: "",
    endDate: "",
    repeat: "weekly",
    interval: 1,
    repeatWeekdays: [3, 1],
    repeatEndMode: "count",
    repeatCount: 6,
    repeatUntil: "",
    reminders: [30, 10, 10],
    goalId: "",
    projectId: "project-1",
  };

  it("accepts a valid timed form", () => {
    expect(eventFormSchema.safeParse(timedForm).success).toBe(true);
  });

  it("rejects a form with the wrong fields for its all-day flag", () => {
    expect(
      eventFormSchema.safeParse({ ...timedForm, allDay: true, startDate: "", endDate: "" }).success,
    ).toBe(false);
  });

  it("assembles a create input with a normalised recurrence and reminders", () => {
    const input = eventInputFromForm(timedForm);
    expect(input.startDateTime).toBe("2026-07-15T09:00:00-04:00");
    expect(input.endDateTime).toBe("2026-07-15T11:00:00-04:00");
    expect(input.startDate).toBeNull();
    expect(input.recurrence).toEqual({
      frequency: "weekly",
      interval: 1,
      weekdays: [1, 3],
      count: 6,
      until: null,
    });
    expect(input.reminders).toEqual([10, 30]);
    expect(input.projectId).toBe("project-1");
    expect(input.goalId).toBeNull();
    expect(eventCreateSchema.safeParse(input).success).toBe(true);
  });

  it("assembles an all-day input", () => {
    const input = eventInputFromForm({
      ...timedForm,
      allDay: true,
      startDate: "2026-07-15",
      endDate: "2026-07-16",
      repeat: "none",
    });
    expect(input.allDay).toBe(true);
    expect(input.startDate).toBe("2026-07-15");
    expect(input.startDateTime).toBeNull();
    expect(input.recurrence).toBeNull();
  });
});

describe("eventSchema", () => {
  it("validates a stored record", () => {
    const record = eventSchema.parse({
      id: "e1",
      ...timedEvent,
      status: "active",
      version: 1,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
    });
    expect(record.title).toBe("Team sync");
  });
});
