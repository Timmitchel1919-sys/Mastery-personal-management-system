import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions, type Functions } from "firebase/functions";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";
import { EMULATOR_CONFIG, getFirebaseClientConfig, useFirebaseEmulators } from "./config";
import { ensureAppCheck } from "./app-check";

/** Must match `DEFAULT_REGION` in `functions/src/config/region.ts`. */
const FUNCTIONS_REGION = "europe-west1";

export interface FirebaseClient {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  functions: Functions;
}

declare global {
  // Survives dev/HMR module re-evaluation so we connect the emulators exactly once.
  var __masteryEmulatorsConnected: boolean | undefined;
}

let cached: FirebaseClient | null = null;

/**
 * Lazily initialize and return the browser Firebase SDK singleton. Safe to call
 * repeatedly. Connects to the Emulator Suite when `NEXT_PUBLIC_USE_FIREBASE_EMULATORS`
 * is `true`.
 */
export function getFirebaseClient(): FirebaseClient {
  if (cached) return cached;

  const app = getApps()[0] ?? initializeApp(getFirebaseClientConfig());
  // App Check must be set up before any other SDK call (Layer 20). No-op without a key.
  ensureAppCheck(app);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  const functions = getFunctions(app, FUNCTIONS_REGION);

  if (useFirebaseEmulators && !globalThis.__masteryEmulatorsConnected) {
    const { host, authPort, firestorePort, storagePort, functionsPort } = EMULATOR_CONFIG;
    connectAuthEmulator(auth, `http://${host}:${authPort}`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, firestorePort);
    connectStorageEmulator(storage, host, storagePort);
    connectFunctionsEmulator(functions, host, functionsPort);
    globalThis.__masteryEmulatorsConnected = true;
  }

  cached = { app, auth, db, storage, functions };
  return cached;
}
