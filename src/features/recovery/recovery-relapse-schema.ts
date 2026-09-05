import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema } from "@/lib/validation";

/**
 * Recovery setback records (Layer 15C) —
 * `users/{uid}/recoveryGoals/{goalId}/relapses/{id}`. Per `docs/RECOVERY_PRIVACY.md` §3
 * these are **written only by a Cloud Function** (`recordRecoverySetback`); the Firestore
 * rules reject a direct client write. The client reads them back and calls the callable
 * to create one. Framing is restart-oriented, not shame-oriented — every setback record
 * carries a `restartPlan`.
 */

const shortListSchema = z.array(z.string().trim().min(1).max(200)).max(30);

const relapseFieldsSchema = z.object({
  date: isoDateSchema,
  whatHappened: z.string().trim().min(1).max(2000),
  contributingFactors: shortListSchema,
  lessonsLearned: z.string().trim().max(2000),
  restartPlan: z.string().trim().max(2000),
});

export const recoveryRelapseSchema = defineRecordSchema(relapseFieldsSchema.shape);
export type RecoveryRelapse = z.infer<typeof recoveryRelapseSchema>;

/** The payload the client sends to the `recordRecoverySetback` callable. */
export const recoveryRelapseRequestSchema = relapseFieldsSchema.extend({
  goalId: z.string().trim().min(1),
});
export type RecoveryRelapseRequest = z.infer<typeof recoveryRelapseRequestSchema>;

export const recoveryRelapseResultSchema = z.object({
  relapseId: z.string().min(1),
});
export type RecoveryRelapseResult = z.infer<typeof recoveryRelapseResultSchema>;

export const recoveryRelapseFormSchema = z.object({
  date: isoDateSchema,
  whatHappened: z.string().trim().min(1, "A short note helps you look back later").max(2000),
  contributingFactorsText: z.string().trim().max(3000),
  lessonsLearned: z.string().trim().max(2000),
  restartPlan: z.string().trim().max(2000),
});
export type RecoveryRelapseFormValues = z.infer<typeof recoveryRelapseFormSchema>;

function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export function recoveryRelapseRequestFromForm(
  goalId: string,
  values: RecoveryRelapseFormValues,
): RecoveryRelapseRequest {
  return {
    goalId,
    date: values.date,
    whatHappened: values.whatHappened,
    contributingFactors: linesToList(values.contributingFactorsText),
    lessonsLearned: values.lessonsLearned,
    restartPlan: values.restartPlan,
  };
}
