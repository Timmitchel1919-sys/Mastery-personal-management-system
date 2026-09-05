import { onCall, type CallableRequest } from "firebase-functions/https";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { z } from "zod";
import { DEFAULT_RUNTIME_OPTIONS } from "../config/region";
import { requireAuth } from "../shared/auth";
import { notFound, toHttpsError } from "../shared/errors";
import { validateRequest, validateResponse } from "../shared/validation";
import { adminDb } from "../shared/firebase-admin";

/**
 * Layer 15C — writes a recovery setback record. Per `docs/RECOVERY_PRIVACY.md` §3, relapse
 * records are Cloud-Function-mediated: the Firestore rules reject a direct client write, so
 * this function is the only writer. Verifies the goal exists and belongs to the caller
 * before writing under `users/{uid}/recoveryGoals/{goalId}/relapses`.
 *
 * Written and unit-tested this layer; NOT deployed — the project is on the Spark plan
 * (ADR-0017/0018).
 */

const shortList = z.array(z.string().trim().min(1).max(200)).max(30);

const requestSchema = z.object({
  goalId: z.string().trim().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  whatHappened: z.string().trim().min(1).max(2000),
  contributingFactors: shortList.default([]),
  lessonsLearned: z.string().trim().max(2000).default(""),
  restartPlan: z.string().trim().max(2000).default(""),
});

const responseSchema = z.object({ relapseId: z.string().min(1) });

export async function handleRecordRecoverySetback(
  request: CallableRequest<unknown>,
  db: Firestore = adminDb(),
): Promise<z.infer<typeof responseSchema>> {
  const uid = requireAuth(request);
  const input = validateRequest(requestSchema, request.data);

  const goalSnap = await db.doc(`users/${uid}/recoveryGoals/${input.goalId}`).get();
  if (!goalSnap.exists) {
    throw notFound("That recovery goal was not found");
  }

  const relapseRef = db.collection(`users/${uid}/recoveryGoals/${input.goalId}/relapses`).doc();
  await relapseRef.set({
    id: relapseRef.id,
    date: input.date,
    whatHappened: input.whatHappened,
    contributingFactors: input.contributingFactors,
    lessonsLearned: input.lessonsLearned,
    restartPlan: input.restartPlan,
    status: "active",
    version: 1,
    archivedAt: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: uid,
    updatedBy: uid,
  });

  return validateResponse(responseSchema, { relapseId: relapseRef.id });
}

export const recordRecoverySetback = onCall({ ...DEFAULT_RUNTIME_OPTIONS }, async (request) => {
  try {
    return await handleRecordRecoverySetback(request);
  } catch (error) {
    throw toHttpsError(error);
  }
});
