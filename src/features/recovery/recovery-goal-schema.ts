import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema } from "@/lib/validation";

/**
 * Recovery goals (Layer 15B) — `users/{uid}/recoveryGoals/{goalId}`, one per
 * self-identified behavior the user chooses to work on. Client-written under the existing
 * owner-only rule (not one of the Cloud-Function-mediated collections in
 * `docs/RECOVERY_PRIVACY.md` §3). Copy throughout is growth-oriented and neutral per §4 —
 * a "challenging" stretch is a status, not a failure.
 *
 * Check-ins, relapse/setback logs, and the coping toolkit are subcollections /
 * collections that arrive in Layers 15C–15D; per-goal accountability sharing is 15F.
 * Hard deletion of a goal (and eventually its subcollections) is a dedicated Cloud
 * Function per §8 — this layer offers reversible archive only.
 */

export const RECOVERY_GOAL_STATUSES = ["active", "going-well", "challenging", "paused"] as const;
export const recoveryGoalStatusSchema = z.enum(RECOVERY_GOAL_STATUSES);
export type RecoveryGoalStatus = (typeof RECOVERY_GOAL_STATUSES)[number];

export const RECOVERY_GOAL_STATUS_LABEL: Record<RecoveryGoalStatus, string> = {
  active: "Working on it",
  "going-well": "Going well",
  challenging: "Challenging right now",
  paused: "Paused",
};

export const MAX_LIST_ITEMS = 30;
const listItemSchema = z.string().trim().min(1).max(300);

const recoveryGoalFieldsSchema = z.object({
  behavior: z.string().trim().min(1, "Name what you're working on").max(160),
  description: z.string().trim().max(2000),
  motivation: z.string().trim().max(2000),
  startDate: isoDateSchema.nullable(),
  triggers: z.array(listItemSchema).max(MAX_LIST_ITEMS),
  warningSigns: z.array(listItemSchema).max(MAX_LIST_ITEMS),
  copingStrategies: z.array(listItemSchema).max(MAX_LIST_ITEMS),
  supportNotes: z.string().trim().max(2000),
  faithBasedEncouragement: z.boolean(),
  recoveryStatus: recoveryGoalStatusSchema,
});

export const recoveryGoalSchema = defineRecordSchema(recoveryGoalFieldsSchema.shape);
export type RecoveryGoal = z.infer<typeof recoveryGoalSchema>;

export const recoveryGoalCreateSchema = recoveryGoalFieldsSchema;
export type RecoveryGoalCreate = z.infer<typeof recoveryGoalCreateSchema>;

export const recoveryGoalUpdateSchema = recoveryGoalFieldsSchema.partial();
export type RecoveryGoalUpdate = z.infer<typeof recoveryGoalUpdateSchema>;

// ── Form shape ────────────────────────────────────────────────────────────────
export const recoveryGoalFormSchema = z.object({
  behavior: z.string().trim().min(1, "Name what you're working on").max(160),
  description: z.string().trim().max(2000),
  motivation: z.string().trim().max(2000),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Pick a date"),
  triggersText: z.string().trim().max(3000),
  warningSignsText: z.string().trim().max(3000),
  copingStrategiesText: z.string().trim().max(3000),
  supportNotes: z.string().trim().max(2000),
  faithBasedEncouragement: z.boolean(),
  recoveryStatus: recoveryGoalStatusSchema,
});
export type RecoveryGoalFormValues = z.infer<typeof recoveryGoalFormSchema>;

function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS);
}

export function recoveryGoalInputFromForm(values: RecoveryGoalFormValues): RecoveryGoalCreate {
  return {
    behavior: values.behavior,
    description: values.description,
    motivation: values.motivation,
    startDate: values.startDate || null,
    triggers: linesToList(values.triggersText),
    warningSigns: linesToList(values.warningSignsText),
    copingStrategies: linesToList(values.copingStrategiesText),
    supportNotes: values.supportNotes,
    faithBasedEncouragement: values.faithBasedEncouragement,
    recoveryStatus: values.recoveryStatus,
  };
}
