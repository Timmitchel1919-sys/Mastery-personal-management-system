import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema } from "@/lib/validation";

/**
 * Accountability partner (Layer 15F) — client side of
 * `functions/src/recovery/*-accountability-*`. Per `docs/RECOVERY_PRIVACY.md` §3/§6:
 * opt-in only, the owner controls which goal is shared, the permission scope, an optional
 * expiry, and revocation. Grant records live at
 * `users/{uid}/recoveryAccountabilityPartners/{partnerId}` and are **written only by the
 * `configureAccountabilityPartner` Cloud Function** (the Firestore rules reject a direct
 * client write). A partner never gets Firestore access — they call
 * `getAccountabilityProjection`, which returns only the scoped projection.
 */

export const ACCOUNTABILITY_SCOPES = [
  "streak-only",
  "status-only",
  "check-in-completed",
  "selected-summary",
  "custom-limited-access",
] as const;
export const accountabilityScopeSchema = z.enum(ACCOUNTABILITY_SCOPES);
export type AccountabilityScope = (typeof ACCOUNTABILITY_SCOPES)[number];

export const ACCOUNTABILITY_SCOPE_LABEL: Record<AccountabilityScope, string> = {
  "streak-only": "Current streak only",
  "status-only": "Status word only",
  "check-in-completed": "Whether I checked in today",
  "selected-summary": "A short progress summary",
  "custom-limited-access": "Custom — I pick the fields",
};

export const ACCOUNTABILITY_SCOPE_DESCRIPTION: Record<AccountabilityScope, string> = {
  "streak-only": "They see the number of days in your current streak. Nothing else.",
  "status-only": "They see your one-word status (e.g. “Going well”). Nothing else.",
  "check-in-completed": "They see only whether you checked in today, and the date of the last one.",
  "selected-summary":
    "They see your status, current streak, days on track, and last check-in date — no notes, no setback details.",
  "custom-limited-access": "They see only the specific fields you tick below.",
};

/** Fields a `custom-limited-access` grant may expose — never notes, triggers, or content. */
export const ACCOUNTABILITY_CUSTOM_FIELDS = [
  "recoveryStatus",
  "currentStreak",
  "daysOnTrack",
  "checkedInToday",
  "lastCheckInDate",
] as const;
export const accountabilityCustomFieldSchema = z.enum(ACCOUNTABILITY_CUSTOM_FIELDS);
export type AccountabilityCustomField = (typeof ACCOUNTABILITY_CUSTOM_FIELDS)[number];

export const ACCOUNTABILITY_CUSTOM_FIELD_LABEL: Record<AccountabilityCustomField, string> = {
  recoveryStatus: "Status word",
  currentStreak: "Current streak",
  daysOnTrack: "Total days on track",
  checkedInToday: "Checked in today?",
  lastCheckInDate: "Last check-in date",
};

const partnerEmailSchema = z.string().trim().toLowerCase().email("Enter a valid email").max(320);

const accountabilityFieldsSchema = z.object({
  goalId: z.string().trim().min(1),
  partnerEmail: partnerEmailSchema,
  partnerLabel: z.string().trim().min(1, "Give this person a label").max(120),
  scope: accountabilityScopeSchema,
  customFields: z.array(accountabilityCustomFieldSchema).max(ACCOUNTABILITY_CUSTOM_FIELDS.length),
  includeSetbackCount: z.boolean(),
  sendCheckInReminders: z.boolean(),
  expiresAt: isoDateSchema.nullable(),
  revokedAt: z.string().nullable(),
});

export const recoveryAccountabilityPartnerSchema = defineRecordSchema(
  accountabilityFieldsSchema.shape,
);
export type RecoveryAccountabilityPartner = z.infer<typeof recoveryAccountabilityPartnerSchema>;

/** Payload sent to `configureAccountabilityPartner`. */
export const configureAccountabilityRequestSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("create"),
    goalId: z.string().trim().min(1),
    partnerEmail: partnerEmailSchema,
    partnerLabel: z.string().trim().min(1).max(120),
    scope: accountabilityScopeSchema,
    customFields: z.array(accountabilityCustomFieldSchema).default([]),
    includeSetbackCount: z.boolean().default(false),
    sendCheckInReminders: z.boolean().default(false),
    expiresAt: isoDateSchema.nullable().default(null),
  }),
  z.object({
    op: z.literal("update"),
    partnerId: z.string().trim().min(1),
    partnerLabel: z.string().trim().min(1).max(120),
    scope: accountabilityScopeSchema,
    customFields: z.array(accountabilityCustomFieldSchema).default([]),
    includeSetbackCount: z.boolean().default(false),
    sendCheckInReminders: z.boolean().default(false),
    expiresAt: isoDateSchema.nullable().default(null),
  }),
  z.object({
    op: z.literal("revoke"),
    partnerId: z.string().trim().min(1),
  }),
]);
export type ConfigureAccountabilityRequest = z.infer<typeof configureAccountabilityRequestSchema>;

export const configureAccountabilityResultSchema = z.object({ partnerId: z.string().min(1) });
export type ConfigureAccountabilityResult = z.infer<typeof configureAccountabilityResultSchema>;

/** The scoped projection a partner receives from `getAccountabilityProjection`. */
export const accountabilityProjectionSchema = z.object({
  scope: accountabilityScopeSchema,
  partnerLabel: z.string(),
  goalBehavior: z.string(),
  recoveryStatus: z.string().nullable(),
  currentStreak: z.number().nullable(),
  daysOnTrack: z.number().nullable(),
  checkedInToday: z.boolean().nullable(),
  lastCheckInDate: z.string().nullable(),
  setbackCount: z.number().nullable(),
  generatedAt: z.string(),
});
export type AccountabilityProjection = z.infer<typeof accountabilityProjectionSchema>;

export const getAccountabilityProjectionRequestSchema = z.object({
  ownerUid: z.string().trim().min(1),
  partnerId: z.string().trim().min(1),
});
export type GetAccountabilityProjectionRequest = z.infer<
  typeof getAccountabilityProjectionRequestSchema
>;

// ── Owner-side form ───────────────────────────────────────────────────────────
export const accountabilityFormSchema = z.object({
  partnerEmail: partnerEmailSchema,
  partnerLabel: z.string().trim().min(1, "Give this person a label").max(120),
  scope: accountabilityScopeSchema,
  customFields: z.array(accountabilityCustomFieldSchema),
  includeSetbackCount: z.boolean(),
  sendCheckInReminders: z.boolean(),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Pick a date"),
});
export type AccountabilityFormValues = z.infer<typeof accountabilityFormSchema>;
