import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import {
  createCheckIn,
  getCheckInForDate,
  listRecentCheckIns,
  updateCheckIn,
} from "@/features/recovery/recovery-checkin-repository";
import { listRecoveryRelapses } from "@/features/recovery/recovery-relapse-client";
import { EMPTY_HALT } from "@/features/recovery/recovery-checkin-schema";
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

async function seedGoal(uid: string, goalId: string) {
  const { db } = getFirebaseClient();
  await setDoc(doc(collection(db, "users", uid, "recoveryGoals"), goalId), {
    id: goalId,
    behavior: "Doomscrolling",
    description: "",
    motivation: "",
    startDate: null,
    triggers: [],
    warningSigns: [],
    copingStrategies: [],
    supportNotes: "",
    faithBasedEncouragement: false,
    recoveryStatus: "active",
    status: "active",
    version: 1,
    archivedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: uid,
    updatedBy: uid,
  });
}

function checkInInput(over: Record<string, unknown> = {}) {
  return {
    date: "2026-09-08",
    stayedOnTrack: true,
    urgeIntensity: 2,
    halt: EMPTY_HALT,
    triggersToday: [],
    copingUsed: [],
    reflection: "",
    ...over,
  };
}

beforeEach(async () => {
  await resetEmulators();
  await authService.signOut().catch(() => {});
});

afterAll(async () => {
  await authService.signOut().catch(() => {});
});

describe("recovery check-ins (nested subcollection)", () => {
  it("creates, finds by date, and updates a check-in under a goal", async () => {
    const user = await signUpFresh("alice");
    await seedGoal(user.uid, "g1");

    const created = await createCheckIn("g1", checkInInput());
    expect(created.createdBy).toBe(user.uid);
    expect(created.date).toBe("2026-09-08");

    const found = await getCheckInForDate("g1", "2026-09-08");
    expect(found?.id).toBe(created.id);

    const updated = await updateCheckIn("g1", created.id, {
      stayedOnTrack: false,
      urgeIntensity: 7,
    });
    expect(updated.stayedOnTrack).toBe(false);
    expect(updated.urgeIntensity).toBe(7);

    const list = await listRecentCheckIns("g1");
    expect(list).toHaveLength(1);
  });

  it("is scoped to the signed-in user", async () => {
    const alice = await signUpFresh("alice");
    await seedGoal(alice.uid, "g1");
    await createCheckIn("g1", checkInInput());
    await authService.signOut();

    await signUpFresh("bob");
    // bob has no such goal; listing its check-ins returns nothing (rules deny cross-user).
    await expect(listRecentCheckIns("g1")).resolves.toEqual([]);
  });

  it("a direct client write to a relapses subcollection is rejected by rules", async () => {
    const user = await signUpFresh("alice");
    await seedGoal(user.uid, "g1");
    const { db } = getFirebaseClient();

    await expect(
      setDoc(doc(collection(db, "users", user.uid, "recoveryGoals", "g1", "relapses")), {
        id: "r1",
        date: "2026-09-08",
        whatHappened: "direct write attempt",
        contributingFactors: [],
        lessonsLearned: "",
        restartPlan: "",
        status: "active",
        version: 1,
        archivedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        updatedBy: user.uid,
      }),
    ).rejects.toBeTruthy();

    expect(await listRecoveryRelapses("g1")).toEqual([]);
  });
});
