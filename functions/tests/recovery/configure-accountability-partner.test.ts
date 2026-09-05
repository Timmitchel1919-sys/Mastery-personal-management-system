import type { CallableRequest } from "firebase-functions/https";
import { describe, expect, it } from "vitest";
import { HttpsError } from "../../src/shared/errors";
import { handleConfigureAccountabilityPartner } from "../../src/recovery/configure-accountability-partner";
import { asFirestore, createFakeFirestore } from "../ai/fakes";

function makeRequest(data: unknown, uid: string | null = "owner1"): CallableRequest<unknown> {
  return {
    auth: uid ? { uid, token: {} as never } : undefined,
    data,
  } as unknown as CallableRequest<unknown>;
}

const CREATE = {
  op: "create" as const,
  goalId: "g1",
  partnerEmail: "Sam@Example.com",
  partnerLabel: "Sam",
  scope: "streak-only" as const,
};

describe("handleConfigureAccountabilityPartner", () => {
  it("throws unauthenticated with no auth", async () => {
    await expect(
      handleConfigureAccountabilityPartner(
        makeRequest(CREATE, null),
        asFirestore(createFakeFirestore()),
      ),
    ).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("rejects an invalid payload", async () => {
    await expect(
      handleConfigureAccountabilityPartner(
        makeRequest({ op: "create", goalId: "g1" }),
        asFirestore(createFakeFirestore()),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("throws not-found on create when the goal isn't the caller's", async () => {
    await expect(
      handleConfigureAccountabilityPartner(makeRequest(CREATE), asFirestore(createFakeFirestore())),
    ).rejects.toMatchObject({ code: "not-found" });
  });

  it("creates a grant with a normalized email and null revokedAt", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/owner1/recoveryGoals/g1", { behavior: "Doomscrolling" });

    const result = await handleConfigureAccountabilityPartner(
      makeRequest(CREATE),
      asFirestore(fake),
    );
    expect(result.partnerId).toBeTruthy();

    const grant = await fake
      .doc(`users/owner1/recoveryAccountabilityPartners/${result.partnerId}`)
      .get();
    expect(grant.data()).toMatchObject({
      goalId: "g1",
      partnerEmail: "sam@example.com",
      partnerLabel: "Sam",
      scope: "streak-only",
      revokedAt: null,
      createdBy: "owner1",
      status: "active",
    });
  });

  it("updates an existing grant's scope and label", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/owner1/recoveryAccountabilityPartners/p1", {
      goalId: "g1",
      partnerEmail: "sam@example.com",
      partnerLabel: "Sam",
      scope: "streak-only",
      revokedAt: null,
      createdBy: "owner1",
    });

    await handleConfigureAccountabilityPartner(
      makeRequest({
        op: "update",
        partnerId: "p1",
        partnerLabel: "Sam (sponsor)",
        scope: "selected-summary",
        includeSetbackCount: true,
      }),
      asFirestore(fake),
    );

    const grant = await fake.doc("users/owner1/recoveryAccountabilityPartners/p1").get();
    expect(grant.data()).toMatchObject({
      partnerLabel: "Sam (sponsor)",
      scope: "selected-summary",
      includeSetbackCount: true,
      updatedBy: "owner1",
    });
  });

  it("revokes a grant by stamping revokedAt", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/owner1/recoveryAccountabilityPartners/p1", {
      goalId: "g1",
      partnerEmail: "sam@example.com",
      scope: "streak-only",
      revokedAt: null,
    });

    await handleConfigureAccountabilityPartner(
      makeRequest({ op: "revoke", partnerId: "p1" }),
      asFirestore(fake),
    );

    const grant = await fake.doc("users/owner1/recoveryAccountabilityPartners/p1").get();
    expect(grant.data()?.revokedAt).not.toBeNull();
    expect(grant.data()?.revokedAt).toBeDefined();
  });

  it("throws not-found when updating a grant that doesn't exist", async () => {
    await expect(
      handleConfigureAccountabilityPartner(
        makeRequest({ op: "update", partnerId: "nope", partnerLabel: "x", scope: "streak-only" }),
        asFirestore(createFakeFirestore()),
      ),
    ).rejects.toBeInstanceOf(HttpsError);
  });
});
