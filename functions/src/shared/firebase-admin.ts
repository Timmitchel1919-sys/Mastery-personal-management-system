import { getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;

/**
 * Firebase Admin app singleton for Cloud Functions. In deployed functions and under the
 * emulator, `initializeApp()` picks up credentials and project id from the environment
 * automatically.
 */
function getAdminApp(): App {
  if (app) return app;
  app = getApps()[0] ?? initializeApp();
  return app;
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function adminDb(): Firestore {
  return getFirestore(getAdminApp());
}
