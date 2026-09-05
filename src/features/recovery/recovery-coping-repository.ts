import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import { makeConverter } from "@/lib/firebase";
import { buildCreateAudit, buildUpdateAudit } from "@/lib/repository";
import { AppError, mapFirebaseError } from "@/lib/errors";
import {
  recoveryCopingActionSchema,
  type RecoveryCopingAction,
  type RecoveryCopingActionCreate,
  type RecoveryCopingActionUpdate,
} from "./recovery-coping-schema";

/**
 * Bespoke repository for the nested
 * `users/{uid}/recoveryGoals/{goalId}/copingActions` subcollection —
 * `createFirestoreRepository` only handles one level under `users/{uid}`. Client-written
 * under the generic owner-only rule (the 15C server-mediation guard matches
 * `.../relapses/{id}` only). Removal is a reversible archive, consistent with every other
 * recovery record.
 */

function requireUid(): string {
  const uid = getFirebaseClient().auth.currentUser?.uid;
  if (!uid) throw new AppError("You must be signed in to do that", { code: "unauthenticated" });
  return uid;
}

function copingCollection(uid: string, goalId: string) {
  return collection(
    getFirebaseClient().db,
    "users",
    uid,
    "recoveryGoals",
    goalId,
    "copingActions",
  ).withConverter(makeConverter(recoveryCopingActionSchema));
}

export async function listCopingActions(
  goalId: string,
  max = 100,
): Promise<RecoveryCopingAction[]> {
  const uid = requireUid();
  try {
    const snapshot = await getDocs(
      query(copingCollection(uid, goalId), orderBy("createdAt", "asc"), fbLimit(max)),
    );
    return snapshot.docs.map((entry) => entry.data()).filter((entry) => entry.status === "active");
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export async function createCopingAction(
  goalId: string,
  input: RecoveryCopingActionCreate,
): Promise<RecoveryCopingAction> {
  const uid = requireUid();
  const ref = doc(
    collection(getFirebaseClient().db, "users", uid, "recoveryGoals", goalId, "copingActions"),
  );
  try {
    await setDoc(ref, { ...input, id: ref.id, userId: uid, ...buildCreateAudit(uid) });
    const snapshot = await getDoc(ref.withConverter(makeConverter(recoveryCopingActionSchema)));
    if (!snapshot.exists()) {
      throw new AppError("Coping action was missing right after create", { code: "unavailable" });
    }
    return snapshot.data();
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export async function updateCopingAction(
  goalId: string,
  id: string,
  patch: RecoveryCopingActionUpdate,
): Promise<RecoveryCopingAction> {
  const uid = requireUid();
  const ref = doc(
    getFirebaseClient().db,
    "users",
    uid,
    "recoveryGoals",
    goalId,
    "copingActions",
    id,
  );
  try {
    await updateDoc(ref, { ...patch, ...buildUpdateAudit(uid) });
    const snapshot = await getDoc(ref.withConverter(makeConverter(recoveryCopingActionSchema)));
    if (!snapshot.exists()) {
      throw new AppError(`Coping action ${id} was not found after update`, { code: "not-found" });
    }
    return snapshot.data();
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

/** Reversible removal from the toolkit — sets `status: "archived"`. */
export async function archiveCopingAction(goalId: string, id: string): Promise<void> {
  const uid = requireUid();
  const ref = doc(
    getFirebaseClient().db,
    "users",
    uid,
    "recoveryGoals",
    goalId,
    "copingActions",
    id,
  );
  try {
    await updateDoc(ref, {
      status: "archived",
      archivedAt: serverTimestamp(),
      ...buildUpdateAudit(uid),
    });
  } catch (error) {
    throw mapFirebaseError(error);
  }
}
