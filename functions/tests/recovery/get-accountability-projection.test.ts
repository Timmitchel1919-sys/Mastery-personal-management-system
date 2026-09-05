import type { CallableRequest } from "firebase-functions/https";
import { describe, expect, it } from "vitest";
import { handleGetAccountabilityProjection } from "../../src/recovery/get-accountability-projection";
import { asFirestore, createFakeFirestore } from "../ai/fakes";
import type { FakeFirestore } from "../ai/fakes";

interface TokenBits {
  email?: string;
  email_verified?: boolean;
}

function makeRequest(
  data: unknown,
  uid: string | null = "partner1",
  token: TokenBits = { email: "sam@example.com", email_verified: true },
): CallableRequest<unknown> {
  return {
    auth: uid ? { uid, token } : undefined,
    data,
  } as unknown as CallableRequest<unknown>;
}

const now = new Date("2026-09-05T09:00:00.000Z");

function seed(fake: FakeFirestore, grant: Record<string, unknown> = {}) {
  fake.seedDoc("users/owner1/recoveryGoals/g1", {
    behavior: "Late-night doomscrolling",
    recoveryStatus: "going-well",
  });
  fake.seedDoc("users/owner1/recoveryGoals/g1/checkIns/c1", {
    date: "2026-09-05",
    stayedOnTrack: true,
    status: "active",
  });
  fake.seedDoc("users/owner1/recoveryGoals/g1/checkIns/c2", {
    date: "2026-09-04",
    stayedOnTrack: true,
    status: "active",
  });
  fake.seedDoc("users/owner1/recoveryGoals/g1/relapses/r1", {
    date: "2026-08-20",
    status: "active",
  });
  fake.seedDoc("users/owner1/recoveryAccountabilityPartners/p1", {
    goalId: "g1",
    partnerEmail: "sam@example.com",
    partnerLabel: "Sam",
    scope: "streak-only",
    customFields: [],
    includeSetbackCount: false,
    expiresAt: null,
    revokedAt: null,
    ...grant,
  });
}

const REQ = { ownerUid: "owner1", partnerId: "p1" };

describe("handleGetAccountabilityProjection", () => {
  it("throws unauthenticated with no auth", async () => {
    const fake = createFakeFirestore();
    seed(fake);
    await expect(
      handleGetAccountabilityProjection(makeRequest(REQ, null), { db: asFirestore(fake), now }),
    ).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("denies a caller without a verified email", async () => {
    const fake = createFakeFirestore();
    seed(fake);
    await expect(
      handleGetAccountabilityProjection(
        makeRequest(REQ, "partner1", { email: "sam@example.com", email_verified: false }),
        { db: asFirestore(fake), now },
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("denies a caller whose email doesn't match the grant", async () => {
    const fake = createFakeFirestore();
    seed(fake);
    await expect(
      handleGetAccountabilityProjection(
        makeRequest(REQ, "partner1", { email: "someone@else.com", email_verified: true }),
        { db: asFirestore(fake), now },
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("denies a revoked grant", async () => {
    const fake = createFakeFirestore();
    seed(fake, { revokedAt: "2026-09-01T00:00:00.000Z" });
    await expect(
      handleGetAccountabilityProjection(makeRequest(REQ), { db: asFirestore(fake), now }),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("denies an expired grant", async () => {
    const fake = createFakeFirestore();
    seed(fake, { expiresAt: "2026-09-01" });
    await expect(
      handleGetAccountabilityProjection(makeRequest(REQ), { db: asFirestore(fake), now }),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("streak-only returns just the streak and the goal label", async () => {
    const fake = createFakeFirestore();
    seed(fake);
    const p = await handleGetAccountabilityProjection(makeRequest(REQ), {
      db: asFirestore(fake),
      now,
    });
    expect(p).toMatchObject({
      scope: "streak-only",
      goalBehavior: "Late-night doomscrolling",
      currentStreak: 2,
      recoveryStatus: null,
      daysOnTrack: null,
      checkedInToday: null,
      lastCheckInDate: null,
      setbackCount: null,
    });
  });

  it("selected-summary returns the curated fields but never a setback count unless opted in", async () => {
    const fake = createFakeFirestore();
    seed(fake, { scope: "selected-summary" });
    const p = await handleGetAccountabilityProjection(makeRequest(REQ), {
      db: asFirestore(fake),
      now,
    });
    expect(p).toMatchObject({
      scope: "selected-summary",
      recoveryStatus: "going-well",
      currentStreak: 2,
      daysOnTrack: 2,
      lastCheckInDate: "2026-09-05",
      setbackCount: null,
    });
    expect(p.checkedInToday).toBeNull();
  });

  it("includes a bare setback count only when the grant opts in", async () => {
    const fake = createFakeFirestore();
    seed(fake, { scope: "selected-summary", includeSetbackCount: true });
    const p = await handleGetAccountabilityProjection(makeRequest(REQ), {
      db: asFirestore(fake),
      now,
    });
    expect(p.setbackCount).toBe(1);
  });

  it("custom-limited-access returns only the ticked fields", async () => {
    const fake = createFakeFirestore();
    seed(fake, { scope: "custom-limited-access", customFields: ["checkedInToday", "daysOnTrack"] });
    const p = await handleGetAccountabilityProjection(makeRequest(REQ), {
      db: asFirestore(fake),
      now,
    });
    expect(p).toMatchObject({
      checkedInToday: true,
      daysOnTrack: 2,
      currentStreak: null,
      recoveryStatus: null,
    });
  });
});
