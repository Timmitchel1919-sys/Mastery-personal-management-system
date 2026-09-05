import type { FirebaseApp } from "firebase/app";

/**
 * Firebase App Check (Layer 20). Attests that requests to Firestore / Storage / Functions
 * come from this app. Initialized once, in the browser only, and **only when a reCAPTCHA
 * v3 site key is configured** (`NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`) — so the app runs
 * unchanged until the owner sets the key and turns on enforcement in the Firebase console.
 * Never runs against the Emulator Suite.
 */

let initialized = false;

export function ensureAppCheck(app: FirebaseApp): void {
  if (initialized || typeof window === "undefined") return;

  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY;
  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
  if (!siteKey || useEmulators) return;

  initialized = true;
  // Dynamic import so the App Check bundle only loads when it's actually used.
  void import("firebase/app-check")
    .then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
    })
    .catch(() => {
      // App Check init failure must not break the app — requests simply go unattested
      // until it recovers (and enforcement, if on, will reject them server-side).
      initialized = false;
    });
}
