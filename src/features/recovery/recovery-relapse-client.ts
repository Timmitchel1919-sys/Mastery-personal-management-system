import { collection, getDocs, limit as fbLimit, orderBy, query } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { getFirebaseClient } from "@/lib/firebase/client";
import { makeConverter } from "@/lib/firebase";
import { AppError, mapFirebaseError, mapFunctionsError } from "@/lib/errors";
import {
  recoveryRelapseResultSchema,
  recoveryRelapseSchema,
  type RecoveryRelapse,
  type RecoveryRelapseRequest,
  type RecoveryRelapseResult,
} from "./recovery-relapse-schema";

function requireUid(): string {
  const uid = getFirebaseClient().auth.currentUser?.uid;
  if (!uid) throw new AppError("You must be signed in to do that", { code: "unauthenticated" });
  return uid;
}

/** Read-only: relapse records are written by the `recordRecoverySetback` Cloud Function. */
export async function listRecoveryRelapses(goalId: string, max = 50): Promise<RecoveryRelapse[]> {
  const uid = requireUid();
  try {
    const snapshot = await getDocs(
      query(
        collection(
          getFirebaseClient().db,
          "users",
          uid,
          "recoveryGoals",
          goalId,
          "relapses",
        ).withConverter(makeConverter(recoveryRelapseSchema)),
        orderBy("date", "desc"),
        fbLimit(max),
      ),
    );
    return snapshot.docs.map((entry) => entry.data()).filter((entry) => entry.status === "active");
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export async function recordRecoverySetback(
  payload: RecoveryRelapseRequest,
): Promise<RecoveryRelapseResult> {
  const callable = httpsCallable(getFirebaseClient().functions, "recordRecoverySetback");
  try {
    const result = await callable(payload);
    return recoveryRelapseResultSchema.parse(result.data);
  } catch (error) {
    throw mapFunctionsError(error);
  }
}
