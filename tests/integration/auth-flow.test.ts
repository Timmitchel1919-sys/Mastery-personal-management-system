import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { doc, getDoc } from "firebase/firestore";
import { authService } from "@/features/auth/auth-service";
import { userProfileRepository } from "@/features/auth/user-profile-repository";
import { getFirebaseClient } from "@/lib/firebase/client";
import { AppError } from "@/lib/errors";

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

beforeEach(async () => {
  await resetEmulators();
  await authService.signOut().catch(() => {});
});

afterAll(async () => {
  await authService.signOut().catch(() => {});
});

describe("registration → profile creation (journeys 1 & 5)", () => {
  it("creates users/{uid} with role 'user' and sane defaults on sign-up", async () => {
    const email = uniqueEmail("alice");
    const user = await authService.signUpWithEmail({
      email,
      password: "sup3rsecret",
      displayName: "Alice Example",
    });

    const profile = await userProfileRepository.ensure(user);

    expect(profile.id).toBe(user.uid);
    expect(profile.role).toBe("user");
    expect(profile.email).toBe(email);
    expect(profile.displayName).toBe("Alice Example");
    expect(profile.onboardingCompleted).toBe(false);
    expect(profile.status).toBe("active");

    const raw = await getDoc(doc(getFirebaseClient().db, "users", user.uid));
    expect(raw.exists()).toBe(true);
    expect(raw.data()?.role).toBe("user");
  });
});

describe("sign out → sign in (journey 2)", () => {
  it("round-trips credentials", async () => {
    const email = uniqueEmail("bob");
    await authService.signUpWithEmail({ email, password: "sup3rsecret", displayName: "Bob" });
    await authService.signOut();
    expect(authService.getCurrentUser()).toBeNull();

    const back = await authService.signInWithEmail({ email, password: "sup3rsecret" });
    expect(back.email).toBe(email);
  });

  it("rejects a wrong password with a normalized error", async () => {
    const email = uniqueEmail("carol");
    await authService.signUpWithEmail({ email, password: "sup3rsecret", displayName: "Carol" });
    await authService.signOut();

    await expect(
      authService.signInWithEmail({ email, password: "wrong-password" }),
    ).rejects.toBeInstanceOf(AppError);
  });
});

describe("user isolation (journey 7)", () => {
  it("prevents one user from reading another user's profile", async () => {
    const aliceEmail = uniqueEmail("alice");
    const alice = await authService.signUpWithEmail({
      email: aliceEmail,
      password: "sup3rsecret",
      displayName: "Alice",
    });
    const aliceUid = alice.uid;
    await userProfileRepository.ensure(alice);
    await authService.signOut();

    const bobEmail = uniqueEmail("bob");
    await authService.signUpWithEmail({
      email: bobEmail,
      password: "sup3rsecret",
      displayName: "Bob",
    });

    // Bob is signed in; reading Alice's profile must be denied by the rules.
    await expect(getDoc(doc(getFirebaseClient().db, "users", aliceUid))).rejects.toMatchObject({
      code: "permission-denied",
    });
  });
});

describe("password reset (journey 4)", () => {
  it("does not throw for a known address", async () => {
    const email = uniqueEmail("dave");
    await authService.signUpWithEmail({ email, password: "sup3rsecret", displayName: "Dave" });
    await authService.signOut();
    await expect(authService.sendPasswordReset(email)).resolves.toBeUndefined();
  });
});
