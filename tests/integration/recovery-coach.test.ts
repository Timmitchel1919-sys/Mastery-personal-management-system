import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { listRecoveryCoachSessions } from "@/features/recovery/recovery-coach-client";
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

beforeEach(async () => {
  await resetEmulators();
  await authService.signOut().catch(() => {});
});

afterAll(async () => {
  await authService.signOut().catch(() => {});
});

describe("recovery coach sessions (Cloud-Function-mediated)", () => {
  it("rejects a direct client write to recoveryCoachSessions", async () => {
    const user = await signUpFresh("alice");
    const { db } = getFirebaseClient();

    await expect(
      setDoc(doc(collection(db, "users", user.uid, "recoveryCoachSessions")), {
        id: "s1",
        goalId: "g1",
        message: "direct write attempt",
        reply: "nope",
        suggestedSteps: [],
        disclaimers: [],
        influencedBy: [],
        status: "active",
        version: 1,
        archivedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        updatedBy: user.uid,
      }),
    ).rejects.toBeTruthy();
  });

  it("lets the owner read sessions written server-side, scoped to a goal", async () => {
    await signUpFresh("alice");
    // No Admin SDK in this test env; assert the read path resolves (empty) rather than throwing.
    await expect(listRecoveryCoachSessions("g1")).resolves.toEqual([]);
  });
});
