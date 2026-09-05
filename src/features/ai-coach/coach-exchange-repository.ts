import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import { makeConverter } from "@/lib/firebase";
import { mapFirebaseError } from "@/lib/errors";
import { coachExchangeSchema, type CoachExchange } from "./schema";

/**
 * Read-only: the Cloud Function (Admin SDK) is the only writer of `coachExchanges` — the
 * client only ever lists its own history, it never creates or edits an exchange.
 */
export async function listRecentCoachExchanges(max = 50): Promise<CoachExchange[]> {
  const { auth, db } = getFirebaseClient();
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  try {
    const converter = makeConverter(coachExchangeSchema);
    const snapshot = await getDocs(
      query(
        collection(db, "users", uid, "coachExchanges").withConverter(converter),
        orderBy("createdAt", "desc"),
        limit(max),
      ),
    );
    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    throw mapFirebaseError(error);
  }
}
