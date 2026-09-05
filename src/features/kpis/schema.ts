import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema } from "@/lib/validation";
import { lifePillarSchema } from "@/lib/validation/domain";

/**
 * KPIs (Layer 12) — `users/{uid}/kpis` + `users/{uid}/kpiEntries`. A KPI is a user-defined
 * metric (spiritual discipline consistency, sleep, financial progress, work performance,
 * community contribution, or anything else) with an optional numeric target and a
 * `direction` saying whether higher or lower values are better. Entries are a separate,
 * append-only time series — the KPI record never stores a "current value"; every reading
 * (latest value, attainment %, trend) is derived from the entry log, the same
 * "computed, never duplicated" pattern used for habit streaks (10B) and skill proficiency
 * (11D). Entries are user-entered only in this layer — system-calculated entries (e.g.
 * auto-derived from Habits/Deep Work/Tasks) are a documented known limitation, not a
 * half-built feature.
 */

export const KPI_DIRECTIONS = ["higher-is-better", "lower-is-better"] as const;
export const kpiDirectionSchema = z.enum(KPI_DIRECTIONS);
export type KpiDirection = (typeof KPI_DIRECTIONS)[number];

export const KPI_DIRECTION_LABEL: Record<KpiDirection, string> = {
  "higher-is-better": "Higher is better",
  "lower-is-better": "Lower is better",
};

export const KPI_WEIGHT_MIN = 1;
export const KPI_WEIGHT_MAX = 5;
const kpiWeightSchema = z.number().int().min(KPI_WEIGHT_MIN).max(KPI_WEIGHT_MAX);

const measureValue = z.number().min(-1_000_000_000).max(1_000_000_000);
const kpiPillarsSchema = z.array(lifePillarSchema).max(3);

const kpiFieldsSchema = z.object({
  title: z.string().trim().min(1, "Give the KPI a title").max(160),
  description: z.string().trim().max(2000),
  category: z.string().trim().max(60),
  pillarIds: kpiPillarsSchema,
  unit: z.string().trim().max(24),
  direction: kpiDirectionSchema,
  targetValue: measureValue.nullable(),
  weight: kpiWeightSchema,
  goalId: z.string().trim().min(1).nullable(),
  notes: z.string().trim().max(2000),
});

export const kpiSchema = defineRecordSchema(kpiFieldsSchema.shape);
export type Kpi = z.infer<typeof kpiSchema>;

export const kpiCreateSchema = kpiFieldsSchema;
export type KpiCreate = z.infer<typeof kpiCreateSchema>;

export const kpiUpdateSchema = kpiFieldsSchema.partial();
export type KpiUpdate = z.infer<typeof kpiUpdateSchema>;

// ── Form shape ────────────────────────────────────────────────────────────────
export const kpiFormSchema = z.object({
  title: z.string().trim().min(1, "Give the KPI a title").max(160),
  description: z.string().trim().max(2000),
  category: z.string().trim().max(60),
  pillarIds: kpiPillarsSchema,
  unit: z.string().trim().max(24),
  direction: kpiDirectionSchema,
  targetValue: measureValue.nullable(),
  weight: kpiWeightSchema,
  goalId: z.string(),
  notes: z.string().trim().max(2000),
});
export type KpiFormValues = z.infer<typeof kpiFormSchema>;

export function kpiInputFromForm(values: KpiFormValues): KpiCreate {
  return {
    title: values.title,
    description: values.description,
    category: values.category,
    pillarIds: values.pillarIds,
    unit: values.unit,
    direction: values.direction,
    targetValue: values.targetValue,
    weight: values.weight,
    goalId: values.goalId || null,
    notes: values.notes,
  };
}

/**
 * Attainment toward a KPI's target, 0-100, from one value. `null` when the KPI has no
 * target (nothing to score against — never silently treated as 0). Assumes non-negative
 * values/targets, which covers counts, durations, currency, and percentages — the
 * overwhelming majority of real-world KPIs; a target of exactly 0 is handled as a pass/fail
 * threshold in both directions.
 */
export function kpiAttainment(
  kpi: Pick<Kpi, "targetValue" | "direction">,
  value: number,
): number | null {
  const { targetValue, direction } = kpi;
  if (targetValue === null) return null;

  if (direction === "higher-is-better") {
    if (targetValue <= 0) return value >= targetValue ? 100 : 0;
    return clampPercent((value / targetValue) * 100);
  }

  // lower-is-better
  if (value <= targetValue) return 100;
  if (value <= 0) return 100;
  return clampPercent((targetValue / value) * 100);
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

// ── KPI entries (the time series) ───────────────────────────────────────────────
const kpiEntryFieldsSchema = z.object({
  kpiId: z.string().trim().min(1),
  date: isoDateSchema,
  value: measureValue,
  note: z.string().trim().max(500),
});

export const kpiEntrySchema = defineRecordSchema(kpiEntryFieldsSchema.shape);
export type KpiEntry = z.infer<typeof kpiEntrySchema>;

export const kpiEntryCreateSchema = kpiEntryFieldsSchema;
export type KpiEntryCreate = z.infer<typeof kpiEntryCreateSchema>;

export const kpiEntryUpdateSchema = kpiEntryFieldsSchema.partial();
export type KpiEntryUpdate = z.infer<typeof kpiEntryUpdateSchema>;

export const kpiEntryFormSchema = z.object({
  date: isoDateSchema,
  value: measureValue,
  note: z.string().trim().max(500),
});
export type KpiEntryFormValues = z.infer<typeof kpiEntryFormSchema>;

export function kpiEntryInputFromForm(kpiId: string, values: KpiEntryFormValues): KpiEntryCreate {
  return { kpiId, date: values.date, value: values.value, note: values.note };
}
