import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema } from "@/lib/validation";
import { lifePillarSchema } from "@/lib/validation/domain";

/**
 * Daily Routine (Layer 10C) — `users/{uid}/routines` + `users/{uid}/routineLogs`. A routine
 * is a named, ordered checklist of steps (an embedded array, like the roadmap phases from
 * Layer 8G) that can link individual steps to a habit, carry a time estimate, and be
 * flagged as a reusable template. Completion is tracked per calendar day in a separate
 * `routineLogs` record (one per routine per day), following the habit-log pattern from
 * Layer 10B, so a routine document itself never mutates as the day progresses.
 */

export const ROUTINE_TYPES = ["morning", "work-study", "evening", "custom"] as const;
export const routineTypeSchema = z.enum(ROUTINE_TYPES);
export type RoutineType = (typeof ROUTINE_TYPES)[number];

export const ROUTINE_TYPE_LABEL: Record<RoutineType, string> = {
  morning: "Morning",
  "work-study": "Work / study",
  evening: "Evening",
  custom: "Custom",
};

export const MAX_ROUTINE_STEPS = 30;

const routinePillarsSchema = z.array(lifePillarSchema).max(3);

const routineStepSchema = z.object({
  id: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1, "Name the step").max(160),
  estimatedMinutes: z.number().int().min(0).max(600),
  habitId: z.string().trim().min(1).nullable(),
});
export type RoutineStep = z.infer<typeof routineStepSchema>;

const routineFieldsSchema = z.object({
  title: z.string().trim().min(1, "Give the routine a title").max(160),
  description: z.string().trim().max(2000),
  routineType: routineTypeSchema,
  pillarIds: routinePillarsSchema,
  isTemplate: z.boolean(),
  steps: z.array(routineStepSchema).max(MAX_ROUTINE_STEPS),
});

export const routineSchema = defineRecordSchema(routineFieldsSchema.shape);
export type Routine = z.infer<typeof routineSchema>;

export const routineCreateSchema = routineFieldsSchema;
export type RoutineCreate = z.infer<typeof routineCreateSchema>;

export const routineUpdateSchema = routineFieldsSchema.partial();
export type RoutineUpdate = z.infer<typeof routineUpdateSchema>;

// ── Routine log ───────────────────────────────────────────────────────────────
const routineLogFieldsSchema = z.object({
  routineId: z.string().trim().min(1),
  /** The calendar day this log is for, `YYYY-MM-DD` — one log per routine per day. */
  date: isoDateSchema,
  completedStepIds: z.array(z.string().trim().min(1)).max(MAX_ROUTINE_STEPS),
  notes: z.string().trim().max(1000),
});

export const routineLogSchema = defineRecordSchema(routineLogFieldsSchema.shape);
export type RoutineLog = z.infer<typeof routineLogSchema>;

export const routineLogCreateSchema = routineLogFieldsSchema;
export type RoutineLogCreate = z.infer<typeof routineLogCreateSchema>;

export const routineLogUpdateSchema = routineLogFieldsSchema.partial();
export type RoutineLogUpdate = z.infer<typeof routineLogUpdateSchema>;

// ── Form shape ────────────────────────────────────────────────────────────────
const routineStepFormSchema = z.object({
  id: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1, "Name the step").max(160),
  estimatedMinutes: z.number().int().min(0).max(600),
  habitId: z.string(),
});
export type RoutineStepFormValues = z.infer<typeof routineStepFormSchema>;

export const routineFormSchema = z.object({
  title: z.string().trim().min(1, "Give the routine a title").max(160),
  description: z.string().trim().max(2000),
  routineType: routineTypeSchema,
  pillarIds: routinePillarsSchema,
  isTemplate: z.boolean(),
  steps: z.array(routineStepFormSchema).max(MAX_ROUTINE_STEPS),
});
export type RoutineFormValues = z.infer<typeof routineFormSchema>;

function newStepId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** A fresh step for the form's `useFieldArray` — always carries a stable id. */
export function emptyRoutineStep(): RoutineStepFormValues {
  return { id: newStepId(), title: "", estimatedMinutes: 0, habitId: "" };
}

export function routineInputFromForm(values: RoutineFormValues): RoutineCreate {
  return {
    title: values.title,
    description: values.description,
    routineType: values.routineType,
    pillarIds: values.pillarIds,
    isTemplate: values.isTemplate,
    steps: values.steps.map((step) => ({
      id: step.id || newStepId(),
      title: step.title,
      estimatedMinutes: step.estimatedMinutes,
      habitId: step.habitId || null,
    })),
  };
}
