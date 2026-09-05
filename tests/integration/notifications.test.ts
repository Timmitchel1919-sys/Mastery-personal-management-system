import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import {
  archiveNotification,
  getNotificationPreferences,
  listRecentNotifications,
  markNotificationRead,
  notificationRepository,
  saveNotificationPreferences,
} from "@/features/notifications/notification-repository";
import { defaultNotificationPreferences } from "@/features/notifications/notification-schema";

const PROJECT_ID = "demo-mastery";
const AUTH_HOST = "http://127.0.0.1:9099";
const FIRESTORE_HOST = "http://127.0.0.1:8080";

async function resetEmulators() {
  await fetch(`${AUTH_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: "DELETE" });
  await fetch(
    `${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: "DELETE" },
  );
}

function uniqueEmail(tag: string) {
  return `${tag}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function signUpFresh(tag: string) {
  return authService.signUpWithEmail({
    email: uniqueEmail(tag),
    password: "sup3rsecret",
    displayName: tag,
  });
}

beforeEach(async () => {
  await resetEmulators();
  await authService.signOut().catch(() => {});
});

afterAll(async () => {
  await authService.signOut().catch(() => {});
});

describe("notifications", () => {
  it("creates, marks read, and archives a notification for the owner", async () => {
    await signUpFresh("owner");
    const created = await notificationRepository.create({
      type: "task-due",
      title: "Due today: Ship",
      body: "This task is due today.",
      relatedId: "t1",
      dedupeKey: "task-due:t1:2026-09-05",
      read: false,
    });
    expect(created.read).toBe(false);

    await markNotificationRead(created.id, true);
    expect((await listRecentNotifications()).find((n) => n.id === created.id)?.read).toBe(true);

    await archiveNotification(created.id);
    expect(await listRecentNotifications()).toEqual([]);
  });

  it("upserts the notification-preferences singleton", async () => {
    await signUpFresh("owner");
    expect(await getNotificationPreferences()).toBeNull();

    const prefs = defaultNotificationPreferences();
    const saved = await saveNotificationPreferences({ ...prefs, milestoneLeadDays: 3 });
    expect(saved.milestoneLeadDays).toBe(3);

    const updated = await saveNotificationPreferences({ ...prefs, milestoneLeadDays: 10 });
    expect(updated.milestoneLeadDays).toBe(10);
    expect(updated.id).toBeTruthy();
  });

  it("scopes notifications to the signed-in user", async () => {
    await signUpFresh("alice");
    await notificationRepository.create({
      type: "weekly-summary",
      title: "Alice summary",
      body: "",
      relatedId: null,
      dedupeKey: "",
      read: false,
    });
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listRecentNotifications()).toEqual([]);
  });
});
