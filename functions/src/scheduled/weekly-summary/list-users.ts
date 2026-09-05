import type { Firestore } from "firebase-admin/firestore";

/**
 * Paginated list of active user ids, ordered by document id. Each page is a bounded read
 * (`limit`); the loop continues until a short page signals there's nothing left — no
 * single unbounded query, even though the overall job is expected to touch every user.
 */
export async function listActiveUserIds(db: Firestore, pageSize = 500): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | undefined;

  for (;;) {
    let query = db
      .collection("users")
      .where("status", "==", "active")
      .orderBy("__name__")
      .limit(pageSize);
    if (cursor) query = query.startAfter(cursor);

    const snapshot = await query.get();
    if (snapshot.empty) break;

    for (const doc of snapshot.docs) ids.push(doc.id);
    cursor = snapshot.docs[snapshot.docs.length - 1]!.id;

    if (snapshot.docs.length < pageSize) break;
  }

  return ids;
}
