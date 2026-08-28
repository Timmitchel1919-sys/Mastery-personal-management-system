import { z } from "zod";

/**
 * Environment configuration, validated once at module load.
 * Import `env` instead of reading `process.env` directly anywhere in the app.
 *
 * Firebase variables are added in Layer 3; AI provider variables in Layer 13.
 */

const appEnvSchema = z.enum(["development", "test", "staging", "production"]);

/** Variables available in both the browser and on the server (`NEXT_PUBLIC_*`). */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_ENV: appEnvSchema.default("development"),
  NEXT_PUBLIC_APP_URL: z.string().trim().min(1).default("http://localhost:3000"),
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
export const env: ClientEnv = Object.freeze(
  parseEnv(
    {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    },
    { server: isServer },
  ),
);

export { appEnvSchema };
