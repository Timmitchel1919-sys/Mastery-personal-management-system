import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema } from "@/lib/validation";
import { lifePillarsSchema, measurementTypeSchema, prioritySchema } from "@/lib/validation/domain";

/** Goals (Layer 8D) — measurable objectives that hang off a plan and roll up to a pillar. */

export const GOAL_STATUSES = [
  "not-started",
  "in-progress",
  "on-hold",
  "achieved",
  "dropped",
] as const;
export const goalStatusSchema = z.enum(GOAL_STATUSES);
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  "on-hold": "On hold",
  achieved: "Achieved",
  dropped: "Dropped",
};

export const REVIEW_FREQUENCIES = ["none", "weekly", "monthly", "quarterly"] as const;
export const reviewFrequencySchema = z.enum(REVIEW_FREQUENCIES);
export type ReviewFrequency = (typeof REVIEW_FREQUENCIES)[number];

export const REVIEW_FREQUENCY_LABEL: Record<ReviewFrequency, string> = {
  none: "No set cadence",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

export const PRIORITY_LABEL: Record<z.infer<typeof prioritySchema>, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const measureValue = z.number().min(-1_000_000_000).max(1_000_000_000);
const datesInOrder = (data: { startDate: string | null; targetDate: string | null }) =>
  !data.startDate || !data.targetDate || data.startDate <= data.targetDate;

const goalFieldsSchema = z.object({
  title: z.string().trim().min(1, "Give the goal a title").max(160),
  description: z.string().trim().max(4000),
  pillarIds: lifePillarsSchema,
  parentPlanId: z.string().trim().min(1).nullable(),
  startDate: isoDateSchema.nullable(),
  targetDate: isoDateSchema.nullable(),
  goalStatus: goalStatusSchema,
  priority: prioritySchema,
  progress: z.number().int().min(0).max(100),
  measurementType: measurementTypeSchema,
  targetValue: measureValue.nullable(),
  currentValue: measureValue.nullable(),
  unit: z.string().trim().max(24),
  reviewFrequency: reviewFrequencySchema,
  notes: z.string().trim().max(4000),
});

export const goalSchema = defineRecordSchema(goalFieldsSchema.shape);
export type Goal = z.infer<typeof goalSchema>;

export const goalCreateSchema = goalFieldsSchema.refine(datesInOrder, {
  path: ["targetDate"],
  message: "Target date must be on or after the start date",
});
export type GoalCreate = z.infer<typeof goalCreateSchema>;

export const goalUpdateSchema = goalFieldsSchema.partial();
export type GoalUpdate = z.infer<typeof goalUpdateSchema>;

/** Form shape — plain strings for dates, `number | null` for the measure fields. */
export const goalFormSchema = z
  .object({
    title: z.string().trim().min(1, "Give the goal a title").max(160),
    description: z.string().trim().max(4000),
    pillarIds: lifePillarsSchema,
    parentPlanId: z.string(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Use a YYYY-MM-DD date"),
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Use a YYYY-MM-DD date"),
    goalStatus: goalStatusSchema,
    priority: prioritySchema,
    progress: z.number().int().min(0).max(100),
    measurementType: measurementTypeSchema,
    targetValue: measureValue.nullable(),
    currentValue: measureValue.nullable(),
    unit: z.string().trim().max(24),
    reviewFrequency: reviewFrequencySchema,
    notes: z.string().trim().max(4000),
  })
  .refine((data) => !data.startDate || !data.targetDate || data.startDate <= data.targetDate, {
    path: ["targetDate"],
    message: "Target date must be on or after the start date",
  });
export type GoalFormValues = z.infer<typeof goalFormSchema>;

export function goalInputFromForm(values: GoalFormValues): GoalCreate {
  return {
    title: values.title,
    description: values.description,
    pillarIds: values.pillarIds,
    parentPlanId: values.parentPlanId || null,
    startDate: values.startDate || null,
    targetDate: values.targetDate || null,
    goalStatus: values.goalStatus,
    priority: values.priority,
    progress: values.progress,
    measurementType: values.measurementType,
    targetValue: values.targetValue,
    currentValue: values.currentValue,
    unit: values.unit,
    reviewFrequency: values.reviewFrequency,
    notes: values.notes,
  };
}
