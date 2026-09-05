import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { listRecentCoachExchanges } from "@/features/ai-coach/coach-exchange-repository";
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
 * `coachExchanges` is written only by the Cloud Function (Admin SDK) — there is no client
 * `create()`. To test the read path, seed a doc directly with the client SDK, matching
 * exactly the shape `handler.ts` writes.
 */
async function seedExchange(uid: string, id: string) {
  const { db } = getFirebaseClient();
  await setDoc(doc(collection(db, "users", uid, "coachExchanges"), id), {
    id,
    intent: "coach-query",
    targetRef: null,
    userMessage: "What should I focus on?",
    answer: "Focus on your top goal this week.",
    assumptions: ["You have a few hours available"],
    suggestedActions: [{ id: "a1", label: "Block 2h", description: "Schedule deep work" }],
    disclaimers: [],
    influencedBy: [{ collection: "goals", id: "g1", label: "Ship v1" }],
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

describe("coachExchanges (read-only client)", () => {
  it("reads back an exchange written by the Cloud Function", async () => {
    const user = await signUpFresh("alice");
    await seedExchange(user.uid, "e1");

    const exchanges = await listRecentCoachExchanges();
    expect(exchanges).toHaveLength(1);
    expect(exchanges[0]).toMatchObject({
      id: "e1",
      intent: "coach-query",
      answer: "Focus on your top goal this week.",
    });
  });

  it("is scoped to the signed-in user", async () => {
    const alice = await signUpFresh("alice");
    await seedExchange(alice.uid, "e1");
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listRecentCoachExchanges()).toHaveLength(0);
  });
});
