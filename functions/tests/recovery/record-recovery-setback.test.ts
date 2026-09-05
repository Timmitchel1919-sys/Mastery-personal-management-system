import type { CallableRequest } from "firebase-functions/https";
import { describe, expect, it } from "vitest";
import { HttpsError } from "../../src/shared/errors";
import { handleRecordRecoverySetback } from "../../src/recovery/record-recovery-setback";
import { asFirestore, createFakeFirestore } from "../ai/fakes";

function makeRequest(data: unknown, uid: string | null = "u1"): CallableRequest<unknown> {
  return {
    auth: uid ? { uid, token: {} as never } : undefined,
    data,
  } as unknown as CallableRequest<unknown>;
}

const VALID = {
  goalId: "g1",
  date: "2026-09-08",
  whatHappened: "Scrolled for two hours after a stressful call.",
  contributingFactors: ["Stress", "Phone in reach"],
  lessonsLearned: "Put the phone in another room when stressed.",
  restartPlan: "Charge it in the kitchen tonight.",
};

describe("handleRecordRecoverySetback", () => {
  it("throws unauthenticated with no auth", async () => {
    const db = asFirestore(createFakeFirestore());
    await expect(handleRecordRecoverySetback(makeRequest(VALID, null), db)).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });

  it("rejects an invalid payload", async () => {
    const db = asFirestore(createFakeFirestore());
    await expect(
      handleRecordRecoverySetback(makeRequest({ goalId: "g1" }), db),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("throws not-found when the goal doesn't exist or isn't the caller's", async () => {
    const db = asFirestore(createFakeFirestore());
    await expect(handleRecordRecoverySetback(makeRequest(VALID), db)).rejects.toMatchObject({
      code: "not-found",
    });
  });

  it("writes the relapse under the goal and returns its id", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1/recoveryGoals/g1", { behavior: "Doomscrolling" });
    const db = asFirestore(fake);

    const result = await handleRecordRecoverySetback(makeRequest(VALID), db);
    expect(result.relapseId).toBeTruthy();

    const relapse = await fake.doc(`users/u1/recoveryGoals/g1/relapses/${result.relapseId}`).get();
    expect(relapse.exists).toBe(true);
    expect(relapse.data()).toMatchObject({
      date: "2026-09-08",
      whatHappened: "Scrolled for two hours after a stressful call.",
      createdBy: "u1",
      status: "active",
    });
  });

  it("defaults optional fields", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1/recoveryGoals/g1", { behavior: "Doomscrolling" });
    const db = asFirestore(fake);

    const result = await handleRecordRecoverySetback(
      makeRequest({ goalId: "g1", date: "2026-09-08", whatHappened: "A hard day." }),
      db,
    );
    const relapse = await fake.doc(`users/u1/recoveryGoals/g1/relapses/${result.relapseId}`).get();
    expect(relapse.data()).toMatchObject({
      contributingFactors: [],
      lessonsLearned: "",
      restartPlan: "",
    });
  });

  it("wraps a thrown error as an HttpsError via the onCall wrapper contract", async () => {
    // handleRecordRecoverySetback itself throws typed HttpsErrors; the onCall wrapper
    // (record-recovery-setback.ts) funnels anything else through toHttpsError.
    const db = asFirestore(createFakeFirestore());
    const error = await handleRecordRecoverySetback(makeRequest({}, "u1"), db).catch((e) => e);
    expect(error).toBeInstanceOf(HttpsError);
  });
});
