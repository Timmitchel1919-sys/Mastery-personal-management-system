import { onCall, type CallableRequest } from "firebase-functions/https";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { z } from "zod";
import { DEFAULT_RUNTIME_OPTIONS } from "../config/region";
import { requireAuth } from "../shared/auth";
import { notFound, toHttpsError } from "../shared/errors";
import { validateRequest, validateResponse } from "../shared/validation";
import { adminDb } from "../shared/firebase-admin";

/**
 * Layer 15F — creates, updates, or revokes an accountability-partner grant. Per
 * `docs/RECOVERY_PRIVACY.md` §3, accountability configuration is Cloud-Function-mediated:
 * the Firestore rules reject a direct client write to `recoveryAccountabilityPartners`, so
 * this function is the only writer. Every op is owner-scoped — it verifies the goal or the
 * existing grant belongs to the caller before writing.
 *
 * Written and unit-tested this layer; NOT deployed — the project is on the Spark plan
 * (ADR-0017/0018/0021/0023).
 */

const scope = z.enum([
  "streak-only",
  "status-only",
  "check-in-completed",
  "selected-summary",
  "custom-limited-access",
]);
const customField = z.enum([
  "recoveryStatus",
  "currentStreak",
  "daysOnTrack",
  "checkedInToday",
  "lastCheckInDate",
]);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const email = z.string().trim().toLowerCase().email().max(320);

const grantFields = {
  partnerLabel: z.string().trim().min(1).max(120),
  scope,
  customFields: z.array(customField).default([]),
  includeSetbackCount: z.boolean().default(false),
  sendCheckInReminders: z.boolean().default(false),
  expiresAt: isoDate.nullable().default(null),
};

const requestSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("create"),
    goalId: z.string().trim().min(1),
    partnerEmail: email,
    ...grantFields,
  }),
  z.object({ op: z.literal("update"), partnerId: z.string().trim().min(1), ...grantFields }),
  z.object({ op: z.literal("revoke"), partnerId: z.string().trim().min(1) }),
]);

const responseSchema = z.object({ partnerId: z.string().min(1) });

export async function handleConfigureAccountabilityPartner(
  request: CallableRequest<unknown>,
  db: Firestore = adminDb(),
): Promise<z.infer<typeof responseSchema>> {
  const uid = requireAuth(request);
  const input = validateRequest(requestSchema, request.data);
  const partnersPath = `users/${uid}/recoveryAccountabilityPartners`;

  if (input.op === "create") {
    const goalSnap = await db.doc(`users/${uid}/recoveryGoals/${input.goalId}`).get();
    if (!goalSnap.exists) throw notFound("That recovery goal was not found");

    const ref = db.collection(partnersPath).doc();
    await ref.set({
      id: ref.id,
      goalId: input.goalId,
      partnerEmail: input.partnerEmail,
      partnerLabel: input.partnerLabel,
      scope: input.scope,
      customFields: input.customFields,
      includeSetbackCount: input.includeSetbackCount,
      sendCheckInReminders: input.sendCheckInReminders,
      expiresAt: input.expiresAt,
      revokedAt: null,
      status: "active",
      version: 1,
      archivedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: uid,
      updatedBy: uid,
    });
    return validateResponse(responseSchema, { partnerId: ref.id });
  }

  const ref = db.doc(`${partnersPath}/${input.partnerId}`);
  const snap = await ref.get();
  if (!snap.exists) throw notFound("That accountability partner was not found");

  if (input.op === "revoke") {
    await ref.update({
      revokedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
    });
    return validateResponse(responseSchema, { partnerId: input.partnerId });
  }

  await ref.update({
    partnerLabel: input.partnerLabel,
    scope: input.scope,
    customFields: input.customFields,
    includeSetbackCount: input.includeSetbackCount,
    sendCheckInReminders: input.sendCheckInReminders,
    expiresAt: input.expiresAt,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: uid,
  });
  return validateResponse(responseSchema, { partnerId: input.partnerId });
}

export const configureAccountabilityPartner = onCall(
  { ...DEFAULT_RUNTIME_OPTIONS },
  async (request) => {
    try {
      return await handleConfigureAccountabilityPartner(request);
    } catch (error) {
      throw toHttpsError(error);
    }
  },
);
