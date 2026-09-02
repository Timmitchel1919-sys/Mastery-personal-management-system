import { z } from "zod";
import { wallTimeToIso } from "@/features/calendar";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateTimeSchema } from "@/lib/validation";
import { lifePillarSchema } from "@/lib/validation/domain";

/**
 * Time Blocking (Layer 9D) — `users/{uid}/timeBlocks`. A time block allocates a wall-clock
 * time range (interpreted in an explicit IANA time zone, like calendar events in Layer 9C)
 * to a category of activity. `goal` / `project` links are real ids; `task` / `habit` /
 * `recovery` links wait for their domains (Layers 10 / 15) and are represented by the
 * category label for now. Overlap detection lives in `detect-conflicts.ts`.
 */

export const TIME_BLOCK_CATEGORIES = [
  "deep-work",
  "task",
  "habit",
  "goal",
  "project",
  "learning",
  "spiritual",
  "recovery",
  "personal",
  "admin",
  "break",
  "other",
] as const;
export const timeBlockCategorySchema = z.enum(TIME_BLOCK_CATEGORIES);
export type TimeBlockCategory = (typeof TIME_BLOCK_CATEGORIES)[number];

export const TIME_BLOCK_CATEGORY_LABEL: Record<TimeBlockCategory, string> = {
  "deep-work": "Deep work",
  task: "Task",
  habit: "Habit",
  goal: "Goal",
  project: "Project",
  learning: "Learning",
  spiritual: "Spiritual",
  recovery: "Recovery",
  personal: "Personal",
  admin: "Admin",
  break: "Break",
  other: "Other",
};

export const TIME_BLOCK_STATUSES = ["planned", "done", "skipped"] as const;
export const timeBlockStatusSchema = z.enum(TIME_BLOCK_STATUSES);
export type TimeBlockStatus = (typeof TIME_BLOCK_STATUSES)[number];

export const TIME_BLOCK_STATUS_LABEL: Record<TimeBlockStatus, string> = {
  planned: "Planned",
  done: "Done",
  skipped: "Skipped",
};

/** Pillars are optional here (a block need not map to a life pillar); 0–3, canonical order. */
const timeBlockPillarsSchema = z.array(lifePillarSchema).max(3);

const timeBlockFieldsSchema = z.object({
  title: z.string().trim().min(1, "Give the block a title").max(160),
  category: timeBlockCategorySchema,
  /** IANA zone id used to interpret the timed fields. */
  timeZone: z.string().trim().min(1).max(64),
  startDateTime: isoDateTimeSchema,
  endDateTime: isoDateTimeSchema,
  pillarIds: timeBlockPillarsSchema,
  goalId: z.string().trim().min(1).nullable(),
  projectId: z.string().trim().min(1).nullable(),
  notes: z.string().trim().max(4000),
  blockStatus: timeBlockStatusSchema,
});

const endAfterStart = (data: { startDateTime: string; endDateTime: string }) =>
  new Date(data.startDateTime).getTime() < new Date(data.endDateTime).getTime();
const END_ORDER_ISSUE = {
  path: ["endDateTime"],
  message: "The end must be after the start",
};

export const timeBlockSchema = defineRecordSchema(timeBlockFieldsSchema.shape);
export type TimeBlock = z.infer<typeof timeBlockSchema>;

export const timeBlockCreateSchema = timeBlockFieldsSchema.refine(endAfterStart, END_ORDER_ISSUE);
export type TimeBlockCreate = z.infer<typeof timeBlockCreateSchema>;

export const timeBlockUpdateSchema = timeBlockFieldsSchema.partial();
export type TimeBlockUpdate = z.infer<typeof timeBlockUpdateSchema>;

// ── Form shape ────────────────────────────────────────────────────────────────
const wallDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Pick a date and time");

export const timeBlockFormSchema = z
  .object({
    title: z.string().trim().min(1, "Give the block a title").max(160),
    category: timeBlockCategorySchema,
    timeZone: z.string().trim().min(1).max(64),
    startWall: wallDateTime,
    endWall: wallDateTime,
    pillarIds: timeBlockPillarsSchema,
    goalId: z.string(),
    projectId: z.string(),
    notes: z.string().trim().max(4000),
    blockStatus: timeBlockStatusSchema,
  })
  .refine((d) => d.startWall < d.endWall, {
    path: ["endWall"],
    message: "The end must be after the start",
  });
export type TimeBlockFormValues = z.infer<typeof timeBlockFormSchema>;

export function timeBlockInputFromForm(values: TimeBlockFormValues): TimeBlockCreate {
  return {
    title: values.title,
    category: values.category,
    timeZone: values.timeZone,
    startDateTime: wallTimeToIso(values.startWall, values.timeZone),
    endDateTime: wallTimeToIso(values.endWall, values.timeZone),
    pillarIds: values.pillarIds,
    goalId: values.goalId || null,
    projectId: values.projectId || null,
    notes: values.notes,
    blockStatus: values.blockStatus,
  };
}

/** Whole-minute duration of a block from its stored ISO instants. Pure. */
export function blockDurationMinutes(block: {
  startDateTime: string;
  endDateTime: string;
}): number {
  const ms = new Date(block.endDateTime).getTime() - new Date(block.startDateTime).getTime();
  return Number.isFinite(ms) ? Math.max(0, Math.round(ms / 60_000)) : 0;
}
