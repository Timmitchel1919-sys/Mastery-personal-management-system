import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";

/**
 * Recovery Coach (Layer 15E) — client side of `functions/src/recovery/recovery-coach-*`.
 * The coach runs entirely server-side in an isolated Cloud Function
 * (`recoveryCoachQuery`), with its own system prompt and a context builder that reads only
 * the caller's recovery data (`docs/RECOVERY_PRIVACY.md` §5, `docs/AI_ARCHITECTURE.md` §7).
 * This feature calls that callable and reads back `users/{uid}/recoveryCoachSessions` — it
 * never talks to an AI provider and holds no key. Sessions are written only by the Cloud
 * Function; the Firestore rules reject a direct client write.
 */

export const MAX_COACH_MESSAGE = 4000;

const coachStepSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
});
export type RecoveryCoachStep = z.infer<typeof coachStepSchema>;

const contextRefSchema = z.object({
  collection: z.string().min(1),
  id: z.string().min(1),
  label: z.string().min(1),
});
export type RecoveryCoachContextRef = z.infer<typeof contextRefSchema>;

/** Payload sent to the `recoveryCoachQuery` callable. */
export const recoveryCoachRequestSchema = z.object({
  goalId: z.string().trim().min(1),
  message: z.string().trim().min(1).max(MAX_COACH_MESSAGE),
});
export type RecoveryCoachRequest = z.infer<typeof recoveryCoachRequestSchema>;

/** What the callable returns — mirrors `recoveryCoachResponseSchema` on the function side. */
export const recoveryCoachResultSchema = z.object({
  reply: z.string().min(1),
  suggestedSteps: z.array(coachStepSchema),
  disclaimers: z.array(z.string()),
  influencedBy: z.array(contextRefSchema),
  sessionId: z.string().min(1),
  createdAt: z.string(),
});
export type RecoveryCoachResult = z.infer<typeof recoveryCoachResultSchema>;

const recoveryCoachSessionFieldsSchema = z.object({
  goalId: z.string(),
  message: z.string(),
  reply: z.string(),
  suggestedSteps: z.array(coachStepSchema),
  disclaimers: z.array(z.string()),
  influencedBy: z.array(contextRefSchema),
});

/** The persisted session read back for the coach's history — written by the Cloud Function. */
export const recoveryCoachSessionSchema = defineRecordSchema(
  recoveryCoachSessionFieldsSchema.shape,
);
export type RecoveryCoachSession = z.infer<typeof recoveryCoachSessionSchema>;

export const recoveryCoachFormSchema = z.object({
  message: z.string().trim().min(1, "Write a line about what's going on").max(MAX_COACH_MESSAGE),
});
export type RecoveryCoachFormValues = z.infer<typeof recoveryCoachFormSchema>;
