import { collection, getDocs, limit as fbLimit, orderBy, query } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { getFirebaseClient } from "@/lib/firebase/client";
import { makeConverter } from "@/lib/firebase";
import { AppError, mapFirebaseError, mapFunctionsError } from "@/lib/errors";
import {
  recoveryCoachResultSchema,
  recoveryCoachSessionSchema,
  type RecoveryCoachRequest,
  type RecoveryCoachResult,
  type RecoveryCoachSession,
} from "./recovery-coach-schema";

function requireUid(): string {
  const uid = getFirebaseClient().auth.currentUser?.uid;
  if (!uid) throw new AppError("You must be signed in to do that", { code: "unauthenticated" });
  return uid;
}

/** Calls the isolated `recoveryCoachQuery` Cloud Function and validates its response. */
export async function askRecoveryCoach(
  payload: RecoveryCoachRequest,
): Promise<RecoveryCoachResult> {
  const callable = httpsCallable(getFirebaseClient().functions, "recoveryCoachQuery");
  try {
    const result = await callable(payload);
    return recoveryCoachResultSchema.parse(result.data);
  } catch (error) {
    throw mapFunctionsError(error);
  }
}

/**
 * Read-only: sessions are written by the Cloud Function. Fetches the most recent sessions
 * and filters to one goal client-side, avoiding a composite index for a small collection.
 */
export async function listRecoveryCoachSessions(
  goalId: string,
  max = 20,
): Promise<RecoveryCoachSession[]> {
  const uid = requireUid();
  try {
    const snapshot = await getDocs(
      query(
        collection(getFirebaseClient().db, "users", uid, "recoveryCoachSessions").withConverter(
          makeConverter(recoveryCoachSessionSchema),
        ),
        orderBy("createdAt", "desc"),
        fbLimit(max),
      ),
    );
    return snapshot.docs
      .map((entry) => entry.data())
      .filter((entry) => entry.status === "active" && entry.goalId === goalId);
  } catch (error) {
    throw mapFirebaseError(error);
  }
}
