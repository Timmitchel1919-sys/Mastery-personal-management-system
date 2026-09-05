import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import {
  archiveWeeklySummary,
  deleteWeeklySummary,
  listRecentWeeklySummaries,
} from "@/features/weekly-summaries/weekly-summary-repository";
import { getFirebaseClient } from "@/lib/firebase/client";

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

/**
 * `weeklySummaries` is written only by the scheduled Cloud Function (Admin SDK) — there
 * is no client `create()`. To test the read/archive/delete paths, seed a doc directly
 * with the client SDK, matching exactly the shape `generate-weekly-summary-for-user.ts`
 * writes.
 */
async function seedSummary(uid: string, id: string) {
  const { db } = getFirebaseClient();
  await setDoc(doc(collection(db, "users", uid, "weeklySummaries"), id), {
    id,
    weekStart: "2026-08-31",
    weekEnd: "2026-09-07",
    goalsCompleted: ["Ship v1"],
    milestonesCompleted: [],
    tasksCompleted: 5,
    tasksCompletedOnTime: 4,
    tasksCompletedLate: 1,
    tasksCancelled: 0,
    tasksStillOverdue: 1,
    habitConsistencyPercent: 80,
    focusMinutes: 240,
    kpiMovements: [],
    lessons: ["You kept a strong focus streak."],
    suggestedPriorities: ["Follow up on the overdue task."],
    status: "active",
    version: 1,
    archivedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: uid,
    updatedBy: uid,
  });
}

beforeEach(async () => {
  await resetEmulators();
  await authService.signOut().catch(() => {});
});

afterAll(async () => {
  await authService.signOut().catch(() => {});
});

describe("weeklySummaries (read/archive/delete client)", () => {
  it("reads back a summary written by the scheduled function", async () => {
    const user = await signUpFresh("alice");
    await seedSummary(user.uid, "s1");

    const summaries = await listRecentWeeklySummaries();
    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({ id: "s1", weekStart: "2026-08-31", tasksCompleted: 5 });
  });

  it("archives a summary so it no longer appears in the active list", async () => {
    const user = await signUpFresh("alice");
    await seedSummary(user.uid, "s1");

    await archiveWeeklySummary("s1");
    expect(await listRecentWeeklySummaries()).toHaveLength(0);
  });

  it("permanently deletes a summary", async () => {
    const user = await signUpFresh("alice");
    await seedSummary(user.uid, "s1");

    await deleteWeeklySummary("s1");
    expect(await listRecentWeeklySummaries()).toHaveLength(0);
  });

  it("is scoped to the signed-in user", async () => {
    const alice = await signUpFresh("alice");
    await seedSummary(alice.uid, "s1");
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listRecentWeeklySummaries()).toHaveLength(0);
  });
});
