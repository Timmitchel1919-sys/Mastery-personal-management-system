import "server-only";
import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { useFirebaseEmulators } from "./config";

export interface FirebaseAdmin {
  app: App;
  auth: Auth;
  db: Firestore;
  storage: Storage;
}

interface ServiceAccountJson {
  project_id: string;
  client_email: string;
  private_key: string;
}

let cached: FirebaseAdmin | null = null;

function resolveProjectId(): string | undefined {
  return (
    env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCLOUD_PROJECT ??
    process.env.FIREBASE_PROJECT_ID
  );
}

function initAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = resolveProjectId();

  // Emulators: firebase-admin auto-detects FIRESTORE_EMULATOR_HOST /
  // FIREBASE_AUTH_EMULATOR_HOST from the environment; only a project id is needed.
  if (useFirebaseEmulators) {
    return initializeApp({ projectId: projectId ?? "demo-mastery" });
  }

  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountRaw) {
    let parsed: ServiceAccountJson;
    try {
      parsed = JSON.parse(serviceAccountRaw) as ServiceAccountJson;
    } catch (cause) {
      throw new AppError("FIREBASE_SERVICE_ACCOUNT is not valid JSON", {
        code: "invalid-input",
        cause,
      });
    }
    return initializeApp({
      credential: cert({
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key.replace(/\\n/g, "\n"),
      }),
      projectId: parsed.project_id,
    });
  }

  // Managed environments (Firebase App Hosting, Cloud Run) provide ADC.
  try {
    return initializeApp({ credential: applicationDefault(), projectId });
  } catch (cause) {
    throw new AppError(
      "Firebase Admin credentials are not configured (set FIREBASE_SERVICE_ACCOUNT, enable emulators, or run where Application Default Credentials are available)",
      { code: "invalid-input", cause },
    );
  }
}

/** Lazily initialize and return the Firebase Admin SDK singleton (server only). */
export function getFirebaseAdmin(): FirebaseAdmin {
  if (cached) return cached;
  const app = initAdminApp();
  cached = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };
  return cached;
}
