import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

/** Whether the app should talk to the local Firebase Emulator Suite. */
export const useFirebaseEmulators = env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

const DEMO_PROJECT_ID = "demo-mastery";

/**
 * Resolve the Firebase web SDK config from the environment.
 * - With emulators on, only a project id matters; the rest are filled with harmless
 *   placeholders (the emulators do not validate credentials).
 * - Otherwise every field is required and a missing one throws a clear error.
 */
export function getFirebaseClientConfig(): FirebaseClientConfig {
  const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (useFirebaseEmulators) {
    const id = projectId ?? DEMO_PROJECT_ID;
    return {
      apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo-api-key",
      authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? `${id}.firebaseapp.com`,
      projectId: id,
      storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? `${id}.appspot.com`,
      messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "000000000000",
      appId: env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:000000000000:web:demo",
    };
  }

  const required = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, "_$1").toUpperCase()}`);

  if (missing.length > 0) {
    throw new AppError(`Missing Firebase configuration: ${missing.join(", ")}`, {
      code: "invalid-input",
      context: { missing },
    });
  }

  return {
    apiKey: required.apiKey as string,
    authDomain: required.authDomain as string,
    projectId: required.projectId as string,
    storageBucket: required.storageBucket as string,
    messagingSenderId: required.messagingSenderId as string,
    appId: required.appId as string,
    ...(env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
      ? { measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID }
      : {}),
  };
}

/** Local emulator endpoints (host + ports mirror `firebase.json`). */
export const EMULATOR_CONFIG = {
  host: "127.0.0.1",
  authPort: 9099,
  firestorePort: 8080,
  storagePort: 9199,
  functionsPort: 5001,
} as const;
