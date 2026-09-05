import {
  deleteDoc,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import { makeConverter } from "@/lib/firebase";
import { AppError, mapFirebaseError } from "@/lib/errors";
import { generateSalt, hashPin, verifyPin } from "./pin-crypto";
import { recoveryProfileSchema, type RecoveryProfile } from "./schema";

/** After this many wrong PINs in a row, the client-tracked lockout kicks in. */
const MAX_ATTEMPTS_BEFORE_LOCKOUT = 5;
const LOCKOUT_MS = 30_000;

function requireUid(): string {
  const uid = getFirebaseClient().auth.currentUser?.uid;
  if (!uid) throw new AppError("You must be signed in to do that", { code: "unauthenticated" });
  return uid;
}

function profileRef(uid: string) {
  const converter = makeConverter(recoveryProfileSchema);
  return doc(getFirebaseClient().db, "users", uid, "recoveryProfiles", uid).withConverter(
    converter,
  );
}

/** `null` when the user hasn't set up a Recovery Center PIN yet. */
export async function getRecoveryLock(): Promise<RecoveryProfile | null> {
  const uid = requireUid();
  try {
    const snapshot = await getDoc(profileRef(uid));
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

/** First-time setup (or replacing a forgotten PIN via `resetRecoveryPin` first). */
export async function setRecoveryPin(pin: string): Promise<void> {
  const uid = requireUid();
  const salt = generateSalt();
  const pinHash = await hashPin(pin, salt);

  try {
    await setDoc(doc(getFirebaseClient().db, "users", uid, "recoveryProfiles", uid), {
      id: uid,
      lockMethod: "pin",
      pinHash,
      pinSalt: salt,
      failedAttempts: 0,
      lockedUntil: null,
      status: "active",
      version: 1,
      archivedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: uid,
      updatedBy: uid,
    });
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

/** Throws `rate-limited` while locked out, `not-found` if no PIN exists yet. */
export async function verifyRecoveryPin(pin: string): Promise<boolean> {
  const uid = requireUid();
  const profile = await getRecoveryLock();
  if (!profile) {
    throw new AppError("No PIN has been set up yet", { code: "not-found" });
  }
  if (profile.lockedUntil && profile.lockedUntil > new Date().toISOString()) {
    throw new AppError("Too many attempts. Try again in a moment.", { code: "rate-limited" });
  }

  const ok = await verifyPin(pin, profile.pinSalt, profile.pinHash);
  const ref = doc(getFirebaseClient().db, "users", uid, "recoveryProfiles", uid);

  try {
    if (ok) {
      await updateDoc(ref, {
        failedAttempts: 0,
        lockedUntil: null,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
        version: increment(1),
      });
    } else {
      const attempts = profile.failedAttempts + 1;
      const lockedOut = attempts >= MAX_ATTEMPTS_BEFORE_LOCKOUT;
      await updateDoc(ref, {
        failedAttempts: lockedOut ? 0 : attempts,
        lockedUntil: lockedOut ? new Date(Date.now() + LOCKOUT_MS).toISOString() : null,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
        version: increment(1),
      });
    }
  } catch (error) {
    throw mapFirebaseError(error);
  }

  return ok;
}

/** "Forgot your PIN" — removes the lock config entirely so setup runs again. Recovery
 * Center holds no other data yet in this layer, so nothing else is lost. */
export async function resetRecoveryPin(): Promise<void> {
  const uid = requireUid();
  try {
    await deleteDoc(doc(getFirebaseClient().db, "users", uid, "recoveryProfiles", uid));
  } catch (error) {
    throw mapFirebaseError(error);
  }
}
