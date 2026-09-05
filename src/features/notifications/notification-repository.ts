import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import { makeConverter } from "@/lib/firebase";
import { createFirestoreRepository, buildCreateAudit, buildUpdateAudit } from "@/lib/repository";
import { AppError, mapFirebaseError } from "@/lib/errors";
import {
  notificationCreateSchema,
  notificationPreferencesSchema,
  notificationSchema,
  notificationUpdateSchema,
  type AppNotification,
  type NotificationCreate,
  type NotificationPreferences,
  type NotificationPreferencesInput,
  type NotificationUpdate,
} from "./notification-schema";

function requireUid(): string {
  const uid = getFirebaseClient().auth.currentUser?.uid;
  if (!uid) throw new AppError("You must be signed in to do that", { code: "unauthenticated" });
  return uid;
}

// ── notifications ────────────────────────────────────────────────────────────
export const notificationRepository = createFirestoreRepository<
  AppNotification,
  NotificationCreate,
  NotificationUpdate
>({
  collectionName: "notifications",
  schema: notificationSchema,
  createSchema: notificationCreateSchema,
  updateSchema: notificationUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "desc",
});

export async function listRecentNotifications(max = 60): Promise<AppNotification[]> {
  const page = await notificationRepository.list({
    limit: max,
    orderBy: "createdAt",
    direction: "desc",
  });
  return page.items.filter((entry) => entry.status === "active");
}

export async function markNotificationRead(id: string, read = true): Promise<void> {
  await notificationRepository.update(id, { read });
}

export async function markAllNotificationsRead(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => notificationRepository.update(id, { read: true })));
}

export async function archiveNotification(id: string): Promise<void> {
  await notificationRepository.archive(id);
}

/** Creates the reminder only if no active notification already carries its `dedupeKey`. */
export async function createNotificationIfAbsent(
  input: NotificationCreate,
  existingKeys: Set<string>,
): Promise<AppNotification | null> {
  if (input.dedupeKey && existingKeys.has(input.dedupeKey)) return null;
  return notificationRepository.create(input);
}

// ── preferences (singleton, id == uid) ───────────────────────────────────────
function preferencesRef(uid: string) {
  return doc(getFirebaseClient().db, "users", uid, "notificationPreferences", uid).withConverter(
    makeConverter(notificationPreferencesSchema),
  );
}

/** `null` when the user has never saved preferences. */
export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const uid = requireUid();
  try {
    const snap = await getDoc(preferencesRef(uid));
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export async function saveNotificationPreferences(
  input: NotificationPreferencesInput,
): Promise<NotificationPreferences> {
  const uid = requireUid();
  const ref = doc(getFirebaseClient().db, "users", uid, "notificationPreferences", uid);
  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, { ...input, ...buildUpdateAudit(uid) });
    } else {
      await setDoc(ref, { ...input, id: uid, userId: uid, ...buildCreateAudit(uid) });
    }
    const snap = await getDoc(preferencesRef(uid));
    if (!snap.exists()) {
      throw new AppError("Preferences were missing right after save", { code: "unavailable" });
    }
    return snap.data();
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

/** Count of unread, active notifications — for the topbar badge. */
export async function countUnreadNotifications(max = 60): Promise<number> {
  const items = await listRecentNotifications(max);
  return items.filter((entry) => !entry.read).length;
}
