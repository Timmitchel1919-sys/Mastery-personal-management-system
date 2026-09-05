import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import { makeConverter } from "@/lib/firebase";
import { buildCreateAudit, buildUpdateAudit } from "@/lib/repository";
import { AppError, mapFirebaseError } from "@/lib/errors";
import {
  recoveryCheckInSchema,
  type RecoveryCheckIn,
  type RecoveryCheckInCreate,
  type RecoveryCheckInUpdate,
} from "./recovery-checkin-schema";

/**
 * Bespoke repository for the nested `users/{uid}/recoveryGoals/{goalId}/checkIns`
 * subcollection — `createFirestoreRepository` only handles one level under `users/{uid}`.
 * Client-written under the generic owner-only rule.
 */

function requireUid(): string {
  const uid = getFirebaseClient().auth.currentUser?.uid;
  if (!uid) throw new AppError("You must be signed in to do that", { code: "unauthenticated" });
  return uid;
}

function checkInsCollection(uid: string, goalId: string) {
  return collection(
    getFirebaseClient().db,
    "users",
    uid,
    "recoveryGoals",
    goalId,
    "checkIns",
  ).withConverter(makeConverter(recoveryCheckInSchema));
}

export async function listRecentCheckIns(goalId: string, max = 90): Promise<RecoveryCheckIn[]> {
  const uid = requireUid();
  try {
    const snapshot = await getDocs(
      query(checkInsCollection(uid, goalId), orderBy("date", "desc"), fbLimit(max)),
    );
    return snapshot.docs.map((entry) => entry.data()).filter((entry) => entry.status === "active");
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export async function getCheckInForDate(
  goalId: string,
  date: string,
): Promise<RecoveryCheckIn | null> {
  const uid = requireUid();
  try {
    const snapshot = await getDocs(
      query(checkInsCollection(uid, goalId), where("date", "==", date), fbLimit(1)),
    );
    const entry = snapshot.docs[0]?.data();
    return entry && entry.status === "active" ? entry : null;
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export async function createCheckIn(
  goalId: string,
  input: RecoveryCheckInCreate,
): Promise<RecoveryCheckIn> {
  const uid = requireUid();
  const ref = doc(
    collection(getFirebaseClient().db, "users", uid, "recoveryGoals", goalId, "checkIns"),
  );
  try {
    await setDoc(ref, { ...input, id: ref.id, userId: uid, ...buildCreateAudit(uid) });
    const snapshot = await getDoc(ref.withConverter(makeConverter(recoveryCheckInSchema)));
    if (!snapshot.exists()) {
      throw new AppError("Check-in was missing right after create", { code: "unavailable" });
    }
    return snapshot.data();
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export async function updateCheckIn(
  goalId: string,
  id: string,
  patch: RecoveryCheckInUpdate,
): Promise<RecoveryCheckIn> {
  const uid = requireUid();
  const ref = doc(getFirebaseClient().db, "users", uid, "recoveryGoals", goalId, "checkIns", id);
  try {
    await updateDoc(ref, { ...patch, ...buildUpdateAudit(uid) });
    const snapshot = await getDoc(ref.withConverter(makeConverter(recoveryCheckInSchema)));
    if (!snapshot.exists()) {
      throw new AppError(`Check-in ${id} was not found after update`, { code: "not-found" });
    }
    return snapshot.data();
  } catch (error) {
    throw mapFirebaseError(error);
  }
}
