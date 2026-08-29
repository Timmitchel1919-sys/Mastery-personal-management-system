import { describe, expect, it } from "vitest";
import { userProfileSchema } from "./schema";
import { buildDefaultProfile } from "./user-profile-repository";

const user = {
  uid: "abc123",
  email: "alice@example.com",
  displayName: "Alice Example",
  photoURL: null,
};

describe("buildDefaultProfile", () => {
  it("produces a schema-valid profile with role 'user'", () => {
    const profile = buildDefaultProfile(user);
    expect(() => userProfileSchema.parse(profile)).not.toThrow();
    expect(profile.role).toBe("user");
    expect(profile.id).toBe("abc123");
    expect(profile.createdBy).toBe("abc123");
    expect(profile.updatedBy).toBe("abc123");
    expect(profile.onboardingCompleted).toBe(false);
    expect(profile.status).toBe("active");
  });

  it("derives a display name from the email when none is set", () => {
    const profile = buildDefaultProfile({ ...user, displayName: null });
    expect(profile.displayName).toBe("alice");
  });

  it("defaults language to 'en' and theme to 'system'", () => {
    const profile = buildDefaultProfile(user);
    expect(profile.language).toBe("en");
    expect(profile.theme).toBe("system");
  });
});
