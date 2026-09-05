import type { FirebaseApp } from "firebase/app";
import { afterEach, describe, expect, it, vi } from "vitest";

const initializeAppCheck = vi.fn();
class ReCaptchaV3Provider {
  constructor(public key: string) {}
}
vi.mock("firebase/app-check", () => ({ initializeAppCheck, ReCaptchaV3Provider }));

const fakeApp = {} as FirebaseApp;

afterEach(() => {
  vi.resetModules();
  initializeAppCheck.mockReset();
  delete process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY;
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS = "false";
});

async function loadEnsure() {
  return (await import("./app-check")).ensureAppCheck;
}

describe("ensureAppCheck", () => {
  it("does nothing without a site key", async () => {
    const ensureAppCheck = await loadEnsure();
    ensureAppCheck(fakeApp);
    await Promise.resolve();
    expect(initializeAppCheck).not.toHaveBeenCalled();
  });

  it("does nothing when pointed at the emulator, even with a key", async () => {
    process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY = "site-key";
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS = "true";
    const ensureAppCheck = await loadEnsure();
    ensureAppCheck(fakeApp);
    await Promise.resolve();
    expect(initializeAppCheck).not.toHaveBeenCalled();
  });

  it("initializes App Check once with a reCAPTCHA v3 provider when a key is set", async () => {
    process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY = "site-key";
    const ensureAppCheck = await loadEnsure();
    ensureAppCheck(fakeApp);
    ensureAppCheck(fakeApp);
    await new Promise((r) => setTimeout(r, 0));
    expect(initializeAppCheck).toHaveBeenCalledTimes(1);
    const options = initializeAppCheck.mock.calls[0]?.[1] as {
      isTokenAutoRefreshEnabled: boolean;
      provider: { key: string };
    };
    expect(options).toMatchObject({ isTokenAutoRefreshEnabled: true });
    expect(options.provider.key).toBe("site-key");
  });
});
