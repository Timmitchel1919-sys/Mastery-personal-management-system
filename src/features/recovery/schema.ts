import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateTimeSchema } from "@/lib/validation";

/**
 * Recovery Center privacy gate (Layer 15A) — `users/{uid}/recoveryProfiles/{uid}`, a
 * singleton keyed by the owner's own uid (one lock configuration per user, distinct from
 * `recoveryGoals` which is one-per-behavior and arrives in Layer 15B). This is the app's
 * "additional privacy gate" per `docs/RECOVERY_PRIVACY.md` §1 — PIN today,
 * `LOCK_METHODS` is deliberately an extensible enum so a future WebAuthn/biometric method
 * is a data change, not a schema rewrite.
 *
 * The PIN is a **privacy shield against casual/shoulder-surf access**, not a security
 * boundary against the account owner — the real security boundary is Firebase Auth +
 * owner-only Firestore rules, same as every other collection. Never store the PIN itself:
 * only a salted SHA-256 hash (`pin-crypto.ts`), computed and compared entirely client-side.
 */

export const LOCK_METHODS = ["pin"] as const;
export const lockMethodSchema = z.enum(LOCK_METHODS);
export type LockMethod = (typeof LOCK_METHODS)[number];

export const PIN_PATTERN = /^\d{4,6}$/;

const recoveryProfileFieldsSchema = z.object({
  lockMethod: lockMethodSchema,
  pinHash: z.string().min(1),
  pinSalt: z.string().min(1),
  failedAttempts: z.number().int().min(0).max(999),
  lockedUntil: isoDateTimeSchema.nullable(),
});

export const recoveryProfileSchema = defineRecordSchema(recoveryProfileFieldsSchema.shape);
export type RecoveryProfile = z.infer<typeof recoveryProfileSchema>;

export const recoveryProfileCreateSchema = recoveryProfileFieldsSchema;
export type RecoveryProfileCreate = z.infer<typeof recoveryProfileCreateSchema>;

export const recoveryProfileUpdateSchema = recoveryProfileFieldsSchema.partial();
export type RecoveryProfileUpdate = z.infer<typeof recoveryProfileUpdateSchema>;

export const pinFormSchema = z
  .object({
    pin: z.string().regex(PIN_PATTERN, "Use a 4–6 digit PIN"),
    confirmPin: z.string(),
  })
  .refine((data) => data.pin === data.confirmPin, {
    path: ["confirmPin"],
    message: "PINs do not match",
  });
export type PinFormValues = z.infer<typeof pinFormSchema>;

export const pinEntrySchema = z.object({
  pin: z.string().regex(PIN_PATTERN, "Enter your PIN"),
});
export type PinEntryValues = z.infer<typeof pinEntrySchema>;
