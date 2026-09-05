import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import {
  getRecoveryLock,
  resetRecoveryPin,
  setRecoveryPin,
  verifyRecoveryPin,
} from "@/features/recovery/recovery-lock-repository";

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

describe("recovery lock", () => {
  it("has no lock configured before setup", async () => {
    await signUpFresh("alice");
    expect(await getRecoveryLock()).toBeNull();
  });

  it("sets a PIN, verifies it, and rejects a wrong one", async () => {
    const user = await signUpFresh("alice");
    await setRecoveryPin("4242");

    const profile = await getRecoveryLock();
    expect(profile).not.toBeNull();
    expect(profile!.createdBy).toBe(user.uid);
    expect(profile!.lockMethod).toBe("pin");

    expect(await verifyRecoveryPin("4242")).toBe(true);
    expect(await verifyRecoveryPin("0000")).toBe(false);
  });

  it("locks out after 5 wrong attempts and clears on the next success", async () => {
    await signUpFresh("alice");
    await setRecoveryPin("4242");

    for (let i = 0; i < 5; i++) {
      expect(await verifyRecoveryPin("0000")).toBe(false);
    }

    await expect(verifyRecoveryPin("4242")).rejects.toMatchObject({ code: "rate-limited" });
  });

  it("resets the PIN, requiring setup again", async () => {
    await signUpFresh("alice");
    await setRecoveryPin("4242");
    await resetRecoveryPin();

    expect(await getRecoveryLock()).toBeNull();
    await expect(verifyRecoveryPin("4242")).rejects.toMatchObject({ code: "not-found" });
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await setRecoveryPin("4242");
    await authService.signOut();

    await signUpFresh("bob");
    expect(await getRecoveryLock()).toBeNull();
  });
});
