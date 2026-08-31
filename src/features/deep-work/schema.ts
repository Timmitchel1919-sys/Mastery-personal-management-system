import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateTimeSchema } from "@/lib/validation";

/**
 * Deep Work (Layer 9B). A logbook of focused sessions — intended outcome, goal / project
 * link, start / end time, a distraction log, energy and focus-quality ratings, and
 * completion notes. Stored in `users/{uid}/focusSessions`.
 *
 * `startedAt` / `endedAt` are `datetime-local` wall-clock strings (`YYYY-MM-DDTHH:mm`),
 * kept verbatim — the app has no timezone model until the calendar (Layer 9C).
 */

export const DEEP_WORK_STATUSES = ["planned", "in-progress", "completed", "abandoned"] as const;
export const deepWorkStatusSchema = z.enum(DEEP_WORK_STATUSES);
export type DeepWorkStatus = (typeof DEEP_WORK_STATUSES)[number];

export const DEEP_WORK_STATUS_LABEL: Record<DeepWorkStatus, string> = {
  planned: "Planned",
  "in-progress": "In progress",
  completed: "Completed",
  abandoned: "Abandoned",
};

export const RATING_MIN = 1;
export const RATING_MAX = 5;
const ratingSchema = z.number().int().min(RATING_MIN).max(RATING_MAX);

const distractionLine = z.string().trim().min(1).max(240);
const distractionLog = z.array(distractionLine).max(50);

const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$|^$/, "Use a date and time");

const deepWorkFieldsSchema = z.object({
  title: z.string().trim().min(1, "Give the session a title").max(160),
  intendedOutcome: z.string().trim().max(2000),
  goalId: z.string().trim().min(1).nullable(),
  projectId: z.string().trim().min(1).nullable(),
  plannedMinutes: z.number().int().min(1).max(600),
  startedAt: isoDateTimeSchema.nullable(),
  endedAt: isoDateTimeSchema.nullable(),
  actualMinutes: z.number().int().min(0).max(600),
  energyLevel: ratingSchema,
  focusQuality: ratingSchema,
  distractions: distractionLog,
  completionNotes: z.string().trim().max(4000),
  sessionStatus: deepWorkStatusSchema,
});

const endAfterStart = (data: { startedAt: string | null; endedAt: string | null }) =>
  !data.startedAt || !data.endedAt || data.startedAt <= data.endedAt;
const END_ORDER_ISSUE = {
  path: ["endedAt"],
  message: "End time must be at or after the start time",
};

export const deepWorkSessionSchema = defineRecordSchema(deepWorkFieldsSchema.shape);
export type DeepWorkSession = z.infer<typeof deepWorkSessionSchema>;

export const deepWorkCreateSchema = deepWorkFieldsSchema.refine(endAfterStart, END_ORDER_ISSUE);
export type DeepWorkCreate = z.infer<typeof deepWorkCreateSchema>;

export const deepWorkUpdateSchema = deepWorkFieldsSchema.partial();
export type DeepWorkUpdate = z.infer<typeof deepWorkUpdateSchema>;

export const deepWorkFormSchema = z
  .object({
    title: z.string().trim().min(1, "Give the session a title").max(160),
    intendedOutcome: z.string().trim().max(2000),
    goalId: z.string(),
    projectId: z.string(),
    plannedMinutes: z.number().int().min(1).max(600),
    startedAt: localDateTime,
    endedAt: localDateTime,
    actualMinutes: z.number().int().min(0).max(600),
    energyLevel: ratingSchema,
    focusQuality: ratingSchema,
    distractions: distractionLog,
    completionNotes: z.string().trim().max(4000),
    sessionStatus: deepWorkStatusSchema,
  })
  .refine((data) => !data.startedAt || !data.endedAt || data.startedAt <= data.endedAt, {
    path: ["endedAt"],
    message: "End time must be at or after the start time",
  });
export type DeepWorkFormValues = z.infer<typeof deepWorkFormSchema>;

function minutesBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.min(600, Math.round(ms / 60_000)));
}

export function deepWorkInputFromForm(values: DeepWorkFormValues): DeepWorkCreate {
  const startedAt = values.startedAt || null;
  const endedAt = values.endedAt || null;
  const actualMinutes =
    values.actualMinutes === 0 && startedAt && endedAt
      ? minutesBetween(startedAt, endedAt)
      : values.actualMinutes;

  return {
    title: values.title,
    intendedOutcome: values.intendedOutcome,
    goalId: values.goalId || null,
    projectId: values.projectId || null,
    plannedMinutes: values.plannedMinutes,
    startedAt,
    endedAt,
    actualMinutes,
    energyLevel: values.energyLevel,
    focusQuality: values.focusQuality,
    distractions: values.distractions,
    completionNotes: values.completionNotes,
    sessionStatus: values.sessionStatus,
  };
}
