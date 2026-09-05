import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema } from "@/lib/validation";

/**
 * Recovery check-ins (Layer 15C) — `users/{uid}/recoveryGoals/{goalId}/checkIns/{id}`,
 * one per goal per day. Client-written under the owner-only rule (a check-in is a routine
 * daily log, not a server-mediated setback record). Streak and progress are **derived**
 * from these entries (`recovery-progress.ts`), never stored — same pattern as habit
 * streaks (10B). Language stays neutral per `docs/RECOVERY_PRIVACY.md` §4: "did you stay
 * on track", not "did you fail".
 */

export const MAX_URGE = 10;
const urgeSchema = z.number().int().min(0).max(MAX_URGE);
const shortListSchema = z.array(z.string().trim().min(1).max(200)).max(30);

const haltSchema = z.object({
  hungry: z.boolean(),
  angry: z.boolean(),
  lonely: z.boolean(),
  tired: z.boolean(),
});
export type Halt = z.infer<typeof haltSchema>;
export const EMPTY_HALT: Halt = { hungry: false, angry: false, lonely: false, tired: false };

export const HALT_LABEL: Record<keyof Halt, string> = {
  hungry: "Hungry",
  angry: "Angry",
  lonely: "Lonely",
  tired: "Tired",
};

const checkInFieldsSchema = z.object({
  date: isoDateSchema,
  stayedOnTrack: z.boolean(),
  urgeIntensity: urgeSchema,
  halt: haltSchema,
  triggersToday: shortListSchema,
  copingUsed: shortListSchema,
  reflection: z.string().trim().max(2000),
});

export const recoveryCheckInSchema = defineRecordSchema(checkInFieldsSchema.shape);
export type RecoveryCheckIn = z.infer<typeof recoveryCheckInSchema>;

export const recoveryCheckInCreateSchema = checkInFieldsSchema;
export type RecoveryCheckInCreate = z.infer<typeof recoveryCheckInCreateSchema>;

export const recoveryCheckInUpdateSchema = checkInFieldsSchema.partial();
export type RecoveryCheckInUpdate = z.infer<typeof recoveryCheckInUpdateSchema>;

export const recoveryCheckInFormSchema = z.object({
  date: isoDateSchema,
  stayedOnTrack: z.boolean(),
  urgeIntensity: urgeSchema,
  halt: haltSchema,
  triggersTodayText: z.string().trim().max(3000),
  copingUsedText: z.string().trim().max(3000),
  reflection: z.string().trim().max(2000),
});
export type RecoveryCheckInFormValues = z.infer<typeof recoveryCheckInFormSchema>;

function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export function recoveryCheckInInputFromForm(
  values: RecoveryCheckInFormValues,
): RecoveryCheckInCreate {
  return {
    date: values.date,
    stayedOnTrack: values.stayedOnTrack,
    urgeIntensity: values.urgeIntensity,
    halt: values.halt,
    triggersToday: linesToList(values.triggersTodayText),
    copingUsed: linesToList(values.copingUsedText),
    reflection: values.reflection,
  };
}
