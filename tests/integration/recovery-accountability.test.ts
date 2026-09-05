import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { listAccountabilityPartners } from "@/features/recovery/recovery-accountability-client";
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

describe("recovery accountability grants (Cloud-Function-mediated)", () => {
  it("rejects a direct client write to recoveryAccountabilityPartners", async () => {
    const user = await signUpFresh("owner");
    const { db } = getFirebaseClient();

    await expect(
      setDoc(doc(collection(db, "users", user.uid, "recoveryAccountabilityPartners")), {
        id: "p1",
        goalId: "g1",
        partnerEmail: "sam@example.com",
        partnerLabel: "Sam",
        scope: "streak-only",
        customFields: [],
        includeSetbackCount: false,
        sendCheckInReminders: false,
        expiresAt: null,
        revokedAt: null,
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

  it("lets the owner list their own grants (empty until the Cloud Function writes one)", async () => {
    await signUpFresh("owner");
    await expect(listAccountabilityPartners("g1")).resolves.toEqual([]);
  });
});
