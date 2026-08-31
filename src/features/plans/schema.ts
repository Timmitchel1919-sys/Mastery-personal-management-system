import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema } from "@/lib/validation";
import { lifePillarsSchema } from "@/lib/validation/domain";

/**
 * Planning tiers (Layer 8B–8C). Each tier is its own Firestore collection
 * (`fiveYearPlans`, `yearPlans`, `quarterPlans`, `monthPlans`, `weekPlans`) but they
 * share this one record shape.
 */

export const PLAN_HORIZONS = ["five-year", "one-year", "quarter", "month", "week"] as const;
export const planHorizonSchema = z.enum(PLAN_HORIZONS);
export type PlanHorizon = (typeof PLAN_HORIZONS)[number];

export interface PlanHorizonMeta {
  label: string;
  route: string;
  collectionName: string;
  description: string;
}

export const PLAN_HORIZON_META: Record<PlanHorizon, PlanHorizonMeta> = {
  "five-year": {
    label: "Five-Year Plans",
    route: "/plan/five-year",
    collectionName: "fiveYearPlans",
    description: "Long-horizon plans with objectives, desired outcomes, and key measures.",
  },
  "one-year": {
    label: "One-Year Plans",
    route: "/plan/one-year",
    collectionName: "yearPlans",
    description: "Annual objectives and desired outcomes.",
  },
  quarter: {
    label: "Quarterly Plans",
    route: "/plan/quarterly",
    collectionName: "quarterPlans",
    description: "Quarter objectives that cascade from your one-year plan.",
  },
  month: {
    label: "Monthly Plans",
    route: "/plan/monthly",
    collectionName: "monthPlans",
    description: "Monthly objectives and priorities.",
  },
  week: {
    label: "Weekly Plans",
    route: "/plan/weekly",
    collectionName: "weekPlans",
    description: "Weekly priorities that feed your daily actions.",
  },
};

/**
 * The tier a plan's cascade parent lives in (Layer 8H). Five-year plans sit at the top,
 * so they have no parent tier. Each shorter tier links up to the one above it.
 */
export const PLAN_PARENT_HORIZON: Record<PlanHorizon, PlanHorizon | null> = {
  "five-year": null,
  "one-year": "five-year",
  quarter: "one-year",
  month: "quarter",
  week: "month",
};

export const PLAN_STATUSES = ["planned", "active", "complete", "abandoned"] as const;
export const planStatusSchema = z.enum(PLAN_STATUSES);
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  planned: "Planned",
  active: "Active",
  complete: "Complete",
  abandoned: "Abandoned",
};

const shortLine = z.string().trim().min(1).max(240);
const lineList = z.array(shortLine).max(30);
const datesInOrder = (data: { startDate: string | null; endDate: string | null }) =>
  !data.startDate || !data.endDate || data.startDate <= data.endDate;

/** Feature fields shared by the stored record, the create input, and the update patch. */
const planFieldsSchema = z.object({
  horizon: planHorizonSchema,
  title: z.string().trim().min(1, "Give the plan a title").max(160),
  objective: z.string().trim().min(1, "State the objective").max(2000),
  desiredOutcomes: lineList,
  keyMeasures: lineList,
  startDate: isoDateSchema.nullable(),
  endDate: isoDateSchema.nullable(),
  planStatus: planStatusSchema,
  progress: z.number().int().min(0).max(100),
  reviewNotes: z.string().trim().max(4000),
  pillarIds: lifePillarsSchema,
  /** Parent record in the planning cascade (a vision or a wider plan). Wired in 8H. */
  parentId: z.string().trim().min(1).nullable(),
});

export const planSchema = defineRecordSchema(planFieldsSchema.shape);
export type Plan = z.infer<typeof planSchema>;

/** Repository create input — every field explicit, no transforms (see the factory). */
export const planCreateSchema = planFieldsSchema.refine(datesInOrder, {
  path: ["endDate"],
  message: "End date must be on or after the start date",
});
export type PlanCreate = z.infer<typeof planCreateSchema>;

export const planUpdateSchema = planFieldsSchema.partial();
export type PlanUpdate = z.infer<typeof planUpdateSchema>;

/**
 * The form's own value shape — plain strings for dates so `<input type="date">` and
 * React Hook Form stay simple. `planInputFromForm` maps it to `PlanCreate` on submit.
 */
export const planFormSchema = z
  .object({
    horizon: planHorizonSchema,
    title: z.string().trim().min(1, "Give the plan a title").max(160),
    objective: z.string().trim().min(1, "State the objective").max(2000),
    desiredOutcomes: lineList,
    keyMeasures: lineList,
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Use a YYYY-MM-DD date"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Use a YYYY-MM-DD date"),
    planStatus: planStatusSchema,
    progress: z.number().int().min(0).max(100),
    reviewNotes: z.string().trim().max(4000),
    pillarIds: lifePillarsSchema,
    /** Empty string = no parent; otherwise the id of a plan one tier up (Layer 8H). */
    parentId: z.string(),
  })
  .refine((data) => !data.startDate || !data.endDate || data.startDate <= data.endDate, {
    path: ["endDate"],
    message: "End date must be on or after the start date",
  });
export type PlanFormValues = z.infer<typeof planFormSchema>;

export function planInputFromForm(values: PlanFormValues): PlanCreate {
  return {
    horizon: values.horizon,
    title: values.title,
    objective: values.objective,
    desiredOutcomes: values.desiredOutcomes,
    keyMeasures: values.keyMeasures,
    startDate: values.startDate || null,
    endDate: values.endDate || null,
    planStatus: values.planStatus,
    progress: values.progress,
    reviewNotes: values.reviewNotes,
    pillarIds: values.pillarIds,
    parentId: values.parentId || null,
  };
}
