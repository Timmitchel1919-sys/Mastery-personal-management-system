import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, signInSchema, signUpSchema, userProfileSchema } from "./schema";

describe("signInSchema", () => {
  it("accepts a valid pair and normalizes the email", () => {
    const parsed = signInSchema.parse({ email: "  ALICE@Example.com ", password: "secret" });
    expect(parsed.email).toBe("alice@example.com");
  });

  it("rejects a bad email and an empty password", () => {
    expect(signInSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("requires matching passwords of at least 8 characters", () => {
    expect(
      signUpSchema.safeParse({
        displayName: "Alice",
        email: "a@b.com",
        password: "longenough",
        confirmPassword: "longenough",
      }).success,
    ).toBe(true);

    const mismatch = signUpSchema.safeParse({
      displayName: "Alice",
      email: "a@b.com",
      password: "longenough",
      confirmPassword: "different",
    });
    expect(mismatch.success).toBe(false);
    if (!mismatch.success) {
      expect(mismatch.error.issues.some((i) => i.path.join(".") === "confirmPassword")).toBe(true);
    }

    expect(
      signUpSchema.safeParse({
        displayName: "Alice",
        email: "a@b.com",
        password: "short",
        confirmPassword: "short",
      }).success,
    ).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("validates the email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("userProfileSchema", () => {
  const valid = {
    id: "u1",
    displayName: "Alice",
    email: "a@b.com",
    photoURL: null,
    role: "user",
    language: "en",
    theme: "system",
    timezone: "Europe/Amsterdam",
    accentColorPreference: null,
    onboardingCompleted: false,
    status: "active",
    version: 1,
    createdAt: "2026-08-28T00:00:00.000Z",
    updatedAt: "2026-08-28T00:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
  };

  it("accepts a well-formed profile", () => {
    expect(userProfileSchema.parse(valid).role).toBe("user");
  });

  it("falls back to safe values for an unknown language or theme", () => {
    const parsed = userProfileSchema.parse({ ...valid, language: "fr", theme: "sepia" });
    expect(parsed.language).toBe("en");
    expect(parsed.theme).toBe("system");
  });

  it("rejects an unknown role", () => {
    expect(userProfileSchema.safeParse({ ...valid, role: "superuser" }).success).toBe(false);
  });
});
