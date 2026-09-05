import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import { makeConverter } from "@/lib/firebase";
import { AppError, mapFirebaseError } from "@/lib/errors";
import { weeklySummarySchema, type WeeklySummary } from "./schema";

function requireUid(): string {
  const uid = getFirebaseClient().auth.currentUser?.uid;
  if (!uid) throw new AppError("You must be signed in to do that", { code: "unauthenticated" });
  return uid;
}

/** Read-only: only the scheduled Cloud Function creates a weekly summary. */
export async function listRecentWeeklySummaries(max = 26): Promise<WeeklySummary[]> {
  const { auth, db } = getFirebaseClient();
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  try {
    const converter = makeConverter(weeklySummarySchema);
    const snapshot = await getDocs(
      query(
        collection(db, "users", uid, "weeklySummaries").withConverter(converter),
        orderBy("weekStart", "desc"),
        limit(max),
      ),
    );
    return snapshot.docs
      .map((entry) => entry.data())
      .filter((summary) => summary.status === "active");
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export async function archiveWeeklySummary(id: string): Promise<void> {
  const uid = requireUid();
  try {
    await updateDoc(doc(getFirebaseClient().db, "users", uid, "weeklySummaries", id), {
      status: "archived",
      archivedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: uid,
      version: increment(1),
    });
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export async function deleteWeeklySummary(id: string): Promise<void> {
  const uid = requireUid();
  try {
    await deleteDoc(doc(getFirebaseClient().db, "users", uid, "weeklySummaries", id));
  } catch (error) {
    throw mapFirebaseError(error);
  }
}
