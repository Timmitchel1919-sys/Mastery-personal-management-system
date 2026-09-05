import { describe, expect, it } from "vitest";
import { pinEntrySchema, pinFormSchema, recoveryProfileSchema } from "./schema";

describe("pinFormSchema", () => {
  it("accepts a matching 4-6 digit pin/confirmation pair", () => {
    expect(pinFormSchema.safeParse({ pin: "1234", confirmPin: "1234" }).success).toBe(true);
    expect(pinFormSchema.safeParse({ pin: "123456", confirmPin: "123456" }).success).toBe(true);
  });

  it("rejects a mismatch, and a pin outside 4-6 digits", () => {
    const mismatch = pinFormSchema.safeParse({ pin: "1234", confirmPin: "4321" });
    expect(mismatch.success).toBe(false);
    if (!mismatch.success) {
      expect(mismatch.error.issues.some((issue) => issue.path.join(".") === "confirmPin")).toBe(
        true,
      );
    }

    expect(pinFormSchema.safeParse({ pin: "123", confirmPin: "123" }).success).toBe(false);
    expect(pinFormSchema.safeParse({ pin: "1234567", confirmPin: "1234567" }).success).toBe(false);
    expect(pinFormSchema.safeParse({ pin: "12a4", confirmPin: "12a4" }).success).toBe(false);
  });
});

describe("pinEntrySchema", () => {
  it("accepts a 4-6 digit pin", () => {
    expect(pinEntrySchema.safeParse({ pin: "9999" }).success).toBe(true);
  });

  it("rejects a non-numeric or wrong-length pin", () => {
    expect(pinEntrySchema.safeParse({ pin: "abcd" }).success).toBe(false);
    expect(pinEntrySchema.safeParse({ pin: "12" }).success).toBe(false);
  });
});

describe("recoveryProfileSchema", () => {
  it("validates a stored lock record", () => {
    const record = recoveryProfileSchema.parse({
      id: "u1",
      lockMethod: "pin",
      pinHash: "a".repeat(64),
      pinSalt: "b".repeat(32),
      failedAttempts: 0,
      lockedUntil: null,
      status: "active",
      version: 1,
      createdAt: "2026-09-08T10:00:00.000Z",
      updatedAt: "2026-09-08T10:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
      archivedAt: null,
    });
    expect(record.lockMethod).toBe("pin");
  });

  it("rejects an unknown lock method", () => {
    expect(
      recoveryProfileSchema.safeParse({
        id: "u1",
        lockMethod: "faceId",
        pinHash: "a".repeat(64),
        pinSalt: "b".repeat(32),
        failedAttempts: 0,
        lockedUntil: null,
        status: "active",
        version: 1,
        createdAt: "2026-09-08T10:00:00.000Z",
        updatedAt: "2026-09-08T10:00:00.000Z",
        createdBy: "u1",
        updatedBy: "u1",
        archivedAt: null,
      }).success,
    ).toBe(false);
  });
});
