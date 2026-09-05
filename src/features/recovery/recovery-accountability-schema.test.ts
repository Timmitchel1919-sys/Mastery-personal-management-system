import { describe, expect, it } from "vitest";
import {
  accountabilityProjectionSchema,
  configureAccountabilityRequestSchema,
  recoveryAccountabilityPartnerSchema,
} from "./recovery-accountability-schema";

describe("configureAccountabilityRequestSchema", () => {
  it("normalizes the partner email on create and defaults the optional fields", () => {
    const parsed = configureAccountabilityRequestSchema.parse({
      op: "create",
      goalId: "g1",
      partnerEmail: "  Sam@Example.COM ",
      partnerLabel: "Sam",
      scope: "streak-only",
    });
    expect(parsed).toMatchObject({
      partnerEmail: "sam@example.com",
      customFields: [],
      includeSetbackCount: false,
      sendCheckInReminders: false,
      expiresAt: null,
    });
  });

  it("rejects an unknown scope and a bad email", () => {
    expect(
      configureAccountabilityRequestSchema.safeParse({
        op: "create",
        goalId: "g1",
        partnerEmail: "not-an-email",
        partnerLabel: "Sam",
        scope: "streak-only",
      }).success,
    ).toBe(false);
    expect(
      configureAccountabilityRequestSchema.safeParse({
        op: "create",
        goalId: "g1",
        partnerEmail: "sam@example.com",
        partnerLabel: "Sam",
        scope: "everything",
      }).success,
    ).toBe(false);
  });

  it("accepts a revoke with just a partnerId", () => {
    expect(
      configureAccountabilityRequestSchema.safeParse({ op: "revoke", partnerId: "p1" }).success,
    ).toBe(true);
  });
});

describe("recoveryAccountabilityPartnerSchema", () => {
  it("validates a stored grant", () => {
    const record = recoveryAccountabilityPartnerSchema.parse({
      id: "p1",
      goalId: "g1",
      partnerEmail: "sam@example.com",
      partnerLabel: "Sam",
      scope: "selected-summary",
      customFields: [],
      includeSetbackCount: true,
      sendCheckInReminders: false,
      expiresAt: null,
      revokedAt: null,
      status: "active",
      version: 1,
      createdAt: "2026-09-05T00:00:00.000Z",
      updatedAt: "2026-09-05T00:00:00.000Z",
      createdBy: "owner1",
      updatedBy: "owner1",
      archivedAt: null,
    });
    expect(record.scope).toBe("selected-summary");
  });
});

describe("accountabilityProjectionSchema", () => {
  it("accepts a projection with nulled-out fields", () => {
    const parsed = accountabilityProjectionSchema.parse({
      scope: "streak-only",
      partnerLabel: "Sam",
      goalBehavior: "Doomscrolling",
      recoveryStatus: null,
      currentStreak: 4,
      daysOnTrack: null,
      checkedInToday: null,
      lastCheckInDate: null,
      setbackCount: null,
      generatedAt: "2026-09-05T09:00:00.000Z",
    });
    expect(parsed.currentStreak).toBe(4);
  });
});
