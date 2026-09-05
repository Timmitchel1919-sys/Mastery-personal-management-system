import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import {
  archiveCopingAction,
  createCopingAction,
  listCopingActions,
  updateCopingAction,
} from "@/features/recovery/recovery-coping-repository";
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

function copingInput(over: Record<string, unknown> = {}) {
  return {
    title: "Box breathing",
    category: "physical" as const,
    howTo: "In for 4, hold 4, out 4, hold 4.",
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

describe("recovery coping toolkit (nested subcollection)", () => {
  it("creates, updates, lists, and archives a coping action under a goal", async () => {
    const user = await signUpFresh("alice");
    await seedGoal(user.uid, "g1");

    const created = await createCopingAction("g1", copingInput());
    expect(created.createdBy).toBe(user.uid);
    expect(created.category).toBe("physical");

    const updated = await updateCopingAction("g1", created.id, { title: "Slow breathing" });
    expect(updated.title).toBe("Slow breathing");

    expect(await listCopingActions("g1")).toHaveLength(1);

    await archiveCopingAction("g1", created.id);
    expect(await listCopingActions("g1")).toEqual([]);
  });

  it("is scoped to the signed-in user", async () => {
    const alice = await signUpFresh("alice");
    await seedGoal(alice.uid, "g1");
    await createCopingAction("g1", copingInput());
    await authService.signOut();

    await signUpFresh("bob");
    // bob has no such goal; rules deny cross-user reads, so the list is empty.
    await expect(listCopingActions("g1")).resolves.toEqual([]);
  });
});
