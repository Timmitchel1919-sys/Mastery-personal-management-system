/**
 * Default region for all callable / HTTP / scheduled functions.
 * Kept in one place so every function stays co-located.
 */
export const DEFAULT_REGION = "europe-west1";

/** Shared runtime options applied to every function unless overridden. */
export const DEFAULT_RUNTIME_OPTIONS = {
  region: DEFAULT_REGION,
  memory: "256MiB",
  timeoutSeconds: 30,
} as const;
