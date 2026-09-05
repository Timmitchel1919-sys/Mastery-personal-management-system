import { z } from "zod";

/**
 * Environment configuration, validated once at module load.
 * Import `env` instead of reading `process.env` directly anywhere in the app.
 *
 * Firebase web config is optional here — presence is enforced by
 * `src/lib/firebase/config.ts` only when a real (non-emulator) client is built.
 * Server-only secrets (service account, AI keys) are read directly from
 * `process.env` in their server modules, not through this schema.
 */

const appEnvSchema = z.enum(["development", "test", "staging", "production"]);
const boolStringSchema = z.enum(["true", "false"]);

const firebaseClientShape = {
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().trim().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().trim().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().trim().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().trim().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().trim().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().trim().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().trim().min(1).optional(),
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: boolStringSchema.default("false"),
  /** reCAPTCHA v3 site key for Firebase App Check. When unset, App Check is not
   * initialized (Layer 20) — the owner enables enforcement in the Firebase console. */
  NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY: z.string().trim().min(1).optional(),
} as const;

/** Variables available in both the browser and on the server (`NEXT_PUBLIC_*`). */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_ENV: appEnvSchema.default("development"),
  NEXT_PUBLIC_APP_URL: z.string().trim().min(1).default("http://localhost:3000"),
  ...firebaseClientShape,
});

/** Server-only variables, a superset of the client schema. */
export const serverEnvSchema = clientEnvSchema.extend({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

/**
 * Parse and validate a bag of environment values. Throws a readable error listing
 * every invalid or missing variable.
 */
export function parseEnv(
  source: Record<string, string | undefined>,
  options: { server: boolean },
): ClientEnv | ServerEnv {
  const schema = options.server ? serverEnvSchema : clientEnvSchema;
  const result = schema.safeParse(source);

  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${formatIssues(result.error)}`);
  }

  return result.data;
}

const isServer = typeof window === "undefined";

// Reference NEXT_PUBLIC_* keys explicitly so Next can inline them at build time.
const rawSource: Record<string, string | undefined> = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS,
};

// Treat empty-string env values (common in `.env` files) as "not set".
const source: Record<string, string | undefined> = Object.fromEntries(
  Object.entries(rawSource).map(([key, value]) => [
    key,
    typeof value === "string" && value.trim() === "" ? undefined : value,
  ]),
);

export const env: ClientEnv = Object.freeze(parseEnv(source, { server: isServer }));

export { appEnvSchema };
