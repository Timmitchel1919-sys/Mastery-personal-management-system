import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema } from "@/lib/validation";
import { lifePillarsSchema } from "@/lib/validation/domain";

/**
 * Habits (Layer 10B) — `users/{uid}/habits` + `users/{uid}/habitLogs`. A habit carries a
 * schedule (how often it's expected), a life-pillar link, an optional goal link, a
 * target/unit, and a reminder time. Streaks are **computed** from the schedule + logs
 * (`habit-streak.ts`) rather than stored — the same "derived, never persisted" pattern as
 * the Deep Work session score (Layer 9B) — so they can't drift out of sync with the logs.
 */

export const HABIT_FREQUENCIES = ["daily", "weekly", "monthly"] as const;
export const habitFrequencySchema = z.enum(HABIT_FREQUENCIES);
export type HabitFrequency = (typeof HABIT_FREQUENCIES)[number];

export const HABIT_FREQUENCY_LABEL: Record<HabitFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export const HABIT_STATUSES = ["active", "paused"] as const;
export const habitStatusSchema = z.enum(HABIT_STATUSES);
export type HabitLifecycleStatus = (typeof HABIT_STATUSES)[number];

export const HABIT_STATUS_LABEL: Record<HabitLifecycleStatus, string> = {
  active: "Active",
  paused: "Paused",
};

const weekdaysSchema = z.array(z.number().int().min(0).max(6)).max(7);
const daysOfMonthSchema = z.array(z.number().int().min(1).max(31)).max(31);
const reminderTimeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm");

const habitFieldsSchema = z.object({
  title: z.string().trim().min(1, "Give the habit a title").max(160),
  description: z.string().trim().max(2000),
  pillarIds: lifePillarsSchema,
  goalId: z.string().trim().min(1).nullable(),
  frequency: habitFrequencySchema,
  /** Daily: every N days. Weekly/monthly: unused (kept at 1). */
  interval: z.number().int().min(1).max(365),
  /** Weekly only: 0 (Sun) – 6 (Sat). Empty = every day counts. */
  weekdays: weekdaysSchema,
  /** Monthly only: day-of-month 1–31. Empty defaults to `[1]` when scheduling. */
  daysOfMonth: daysOfMonthSchema,
  target: z.number().min(0).max(100_000),
  unit: z.string().trim().max(40),
  reminderTime: reminderTimeSchema.nullable(),
  habitStatus: habitStatusSchema,
});

export const habitSchema = defineRecordSchema(habitFieldsSchema.shape);
export type Habit = z.infer<typeof habitSchema>;

export const habitCreateSchema = habitFieldsSchema;
export type HabitCreate = z.infer<typeof habitCreateSchema>;

export const habitUpdateSchema = habitFieldsSchema.partial();
export type HabitUpdate = z.infer<typeof habitUpdateSchema>;

// ── Habit log ─────────────────────────────────────────────────────────────────
export const HABIT_LOG_STATUSES = ["completed", "missed"] as const;
export const habitLogStatusSchema = z.enum(HABIT_LOG_STATUSES);
export type HabitLogStatus = (typeof HABIT_LOG_STATUSES)[number];

const habitLogFieldsSchema = z.object({
  habitId: z.string().trim().min(1),
  /** The calendar day this log is for, `YYYY-MM-DD` — one log per habit per day. */
  date: isoDateSchema,
  logStatus: habitLogStatusSchema,
  value: z.number().min(0).max(100_000),
  notes: z.string().trim().max(1000),
});

export const habitLogSchema = defineRecordSchema(habitLogFieldsSchema.shape);
export type HabitLog = z.infer<typeof habitLogSchema>;

export const habitLogCreateSchema = habitLogFieldsSchema;
export type HabitLogCreate = z.infer<typeof habitLogCreateSchema>;

export const habitLogUpdateSchema = habitLogFieldsSchema.partial();
export type HabitLogUpdate = z.infer<typeof habitLogUpdateSchema>;

// ── Form shape ────────────────────────────────────────────────────────────────
export const habitFormSchema = z.object({
  title: z.string().trim().min(1, "Give the habit a title").max(160),
  description: z.string().trim().max(2000),
  pillarIds: lifePillarsSchema,
  goalId: z.string(),
  frequency: habitFrequencySchema,
  interval: z.number().int().min(1).max(365),
  weekdays: weekdaysSchema,
  daysOfMonthText: z.string().trim().max(120),
  target: z.number().min(0).max(100_000),
  unit: z.string().trim().max(40),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$|^$/, "Use HH:mm"),
  habitStatus: habitStatusSchema,
});
export type HabitFormValues = z.infer<typeof habitFormSchema>;

function parseDaysOfMonth(text: string): number[] {
  return [
    ...new Set(
      text
        .split(",")
        .map((part) => Number.parseInt(part.trim(), 10))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 31),
    ),
  ].sort((a, b) => a - b);
}

export function habitInputFromForm(values: HabitFormValues): HabitCreate {
  return {
    title: values.title,
    description: values.description,
    pillarIds: values.pillarIds,
    goalId: values.goalId || null,
    frequency: values.frequency,
    interval: values.frequency === "daily" ? values.interval : 1,
    weekdays: values.frequency === "weekly" ? values.weekdays : [],
    daysOfMonth: values.frequency === "monthly" ? parseDaysOfMonth(values.daysOfMonthText) : [],
    target: values.target,
    unit: values.unit,
    reminderTime: values.reminderTime || null,
    habitStatus: values.habitStatus,
  };
}
