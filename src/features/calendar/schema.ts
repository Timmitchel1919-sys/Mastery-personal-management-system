import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema, isoDateTimeSchema } from "@/lib/validation";
import { wallTimeToIso } from "./zoned-time";

/**
 * Calendar events (Layer 9C) — `users/{uid}/events`. Timed events store an ISO instant with
 * an explicit offset plus the IANA `timeZone` they were entered in; all-day events store
 * plain `YYYY-MM-DD` dates. Recurrence is expanded client-side (see `recurrence.ts`).
 */

export const RECURRENCE_FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;
export const recurrenceFrequencySchema = z.enum(RECURRENCE_FREQUENCIES);
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export const RECURRENCE_FREQUENCY_LABEL: Record<RecurrenceFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export const recurrenceSchema = z.object({
  frequency: recurrenceFrequencySchema,
  interval: z.number().int().min(1).max(365),
  /** For weekly recurrence: 0 = Sunday … 6 = Saturday. Empty = same weekday as the start. */
  weekdays: z.array(z.number().int().min(0).max(6)).max(7),
  /** Stop after this many occurrences. */
  count: z.number().int().min(1).max(730).nullable(),
  /** Stop on/after this date (inclusive). */
  until: isoDateSchema.nullable(),
});
export type Recurrence = z.infer<typeof recurrenceSchema>;

/** Reminder offsets in minutes before the event start. Delivery lands in Layer 17. */
export const remindersSchema = z.array(z.number().int().min(0).max(40_320)).max(5);

const eventFieldsSchema = z.object({
  title: z.string().trim().min(1, "Give the event a title").max(200),
  description: z.string().trim().max(4000),
  location: z.string().trim().max(200),
  allDay: z.boolean(),
  /** IANA zone id used to interpret the timed fields (still stored for all-day events). */
  timeZone: z.string().trim().min(1).max(64),
  startDateTime: isoDateTimeSchema.nullable(),
  endDateTime: isoDateTimeSchema.nullable(),
  startDate: isoDateSchema.nullable(),
  endDate: isoDateSchema.nullable(),
  recurrence: recurrenceSchema.nullable(),
  reminders: remindersSchema,
  goalId: z.string().trim().min(1).nullable(),
  projectId: z.string().trim().min(1).nullable(),
});

function timeShapeIsValid(data: z.infer<typeof eventFieldsSchema>): boolean {
  if (data.allDay) {
    return (
      data.startDate !== null &&
      data.endDate !== null &&
      data.startDateTime === null &&
      data.endDateTime === null
    );
  }
  return (
    data.startDateTime !== null &&
    data.endDateTime !== null &&
    data.startDate === null &&
    data.endDate === null
  );
}

function endNotBeforeStart(data: z.infer<typeof eventFieldsSchema>): boolean {
  if (data.allDay) {
    return !data.startDate || !data.endDate || data.startDate <= data.endDate;
  }
  if (!data.startDateTime || !data.endDateTime) return true;
  return new Date(data.startDateTime).getTime() <= new Date(data.endDateTime).getTime();
}

export const eventSchema = defineRecordSchema(eventFieldsSchema.shape);
export type CalendarEvent = z.infer<typeof eventSchema>;

export const eventCreateSchema = eventFieldsSchema
  .refine(timeShapeIsValid, {
    path: ["allDay"],
    message: "An all-day event needs dates; a timed event needs start and end times",
  })
  .refine(endNotBeforeStart, {
    path: ["endDateTime"],
    message: "The end must be at or after the start",
  });
export type CalendarEventCreate = z.infer<typeof eventCreateSchema>;

export const eventUpdateSchema = eventFieldsSchema.partial();
export type CalendarEventUpdate = z.infer<typeof eventUpdateSchema>;

// ── Form shape ────────────────────────────────────────────────────────────────
export const REPEAT_OPTIONS = ["none", ...RECURRENCE_FREQUENCIES] as const;
export type RepeatOption = (typeof REPEAT_OPTIONS)[number];

export const REPEAT_END_MODES = ["never", "count", "until"] as const;
export type RepeatEndMode = (typeof REPEAT_END_MODES)[number];

export const REMINDER_PRESETS = [0, 5, 10, 30, 60, 1440] as const;

const wallDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$|^$/, "Pick a date and time");

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, "Give the event a title").max(200),
    description: z.string().trim().max(4000),
    location: z.string().trim().max(200),
    allDay: z.boolean(),
    timeZone: z.string().trim().min(1).max(64),
    startWall: wallDateTime,
    endWall: wallDateTime,
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Pick a date"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Pick a date"),
    repeat: z.enum(REPEAT_OPTIONS),
    interval: z.number().int().min(1).max(365),
    repeatWeekdays: z.array(z.number().int().min(0).max(6)).max(7),
    repeatEndMode: z.enum(REPEAT_END_MODES),
    repeatCount: z.number().int().min(1).max(730),
    repeatUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Pick a date"),
    reminders: remindersSchema,
    goalId: z.string(),
    projectId: z.string(),
  })
  .refine(
    (d) =>
      d.allDay ? d.startDate !== "" && d.endDate !== "" : d.startWall !== "" && d.endWall !== "",
    {
      path: ["allDay"],
      message: "Fill in the date and time fields",
    },
  )
  .refine(
    (d) =>
      d.allDay
        ? !d.startDate || !d.endDate || d.startDate <= d.endDate
        : !d.startWall || !d.endWall || d.startWall <= d.endWall,
    {
      path: ["endWall"],
      message: "The end must be at or after the start",
    },
  );
export type CalendarEventFormValues = z.infer<typeof eventFormSchema>;

export function eventInputFromForm(values: CalendarEventFormValues): CalendarEventCreate {
  const recurrence: Recurrence | null =
    values.repeat === "none"
      ? null
      : {
          frequency: values.repeat,
          interval: values.interval,
          weekdays:
            values.repeat === "weekly" ? [...values.repeatWeekdays].sort((a, b) => a - b) : [],
          count: values.repeatEndMode === "count" ? values.repeatCount : null,
          until: values.repeatEndMode === "until" ? values.repeatUntil || null : null,
        };

  return {
    title: values.title,
    description: values.description,
    location: values.location,
    allDay: values.allDay,
    timeZone: values.timeZone,
    startDateTime: values.allDay ? null : wallTimeToIso(values.startWall, values.timeZone),
    endDateTime: values.allDay ? null : wallTimeToIso(values.endWall, values.timeZone),
    startDate: values.allDay ? values.startDate || null : null,
    endDate: values.allDay ? values.endDate || null : null,
    recurrence,
    reminders: [...new Set(values.reminders)].sort((a, b) => a - b),
    goalId: values.goalId || null,
    projectId: values.projectId || null,
  };
}
