import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema } from "@/lib/validation";

/**
 * Life Score (Layer 12) — `users/{uid}/lifeScoreEntries`. A historical snapshot of the
 * computed Life Score (see `../life-score.ts` for the formula), saved on demand so the
 * score has a trend over time even though it is otherwise always recomputed live from the
 * user's KPIs. Each entry freezes the contributing `factors` (per-KPI value, attainment,
 * and weight) at the moment it was saved — per spec, the score must always show how it was
 * calculated, even months later after a KPI's target or weight has since changed.
 */

const lifeScoreFactorSchema = z.object({
  kpiId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(160),
  value: z.number(),
  attainment: z.number().min(0).max(100),
  weight: z.number().int().min(1).max(5),
});
export type LifeScoreFactor = z.infer<typeof lifeScoreFactorSchema>;

const lifeScoreEntryFieldsSchema = z.object({
  date: isoDateSchema,
  score: z.number().min(0).max(100),
  factors: z.array(lifeScoreFactorSchema).max(50),
  note: z.string().trim().max(1000),
});

export const lifeScoreEntrySchema = defineRecordSchema(lifeScoreEntryFieldsSchema.shape);
export type LifeScoreEntry = z.infer<typeof lifeScoreEntrySchema>;

export const lifeScoreEntryCreateSchema = lifeScoreEntryFieldsSchema;
export type LifeScoreEntryCreate = z.infer<typeof lifeScoreEntryCreateSchema>;

export const lifeScoreEntryUpdateSchema = lifeScoreEntryFieldsSchema.partial();
export type LifeScoreEntryUpdate = z.infer<typeof lifeScoreEntryUpdateSchema>;

export const saveScoreFormSchema = z.object({ note: z.string().trim().max(1000) });
export type SaveScoreFormValues = z.infer<typeof saveScoreFormSchema>;

export function lifeScoreEntryInputFromResult(
  score: number,
  factors: LifeScoreFactor[],
  date: string,
  note: string,
): LifeScoreEntryCreate {
  return { date, score, factors, note };
}
