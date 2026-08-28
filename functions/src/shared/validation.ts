import { z, type ZodType } from "zod";
import { badRequest } from "./errors";

/**
 * Parse untrusted request data against a Zod schema. Throws an `invalid-argument`
 * `HttpsError` (with the failing field paths) on mismatch. Use at the top of every
 * callable / HTTP handler before any business logic.
 */
export function validateRequest<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw badRequest("Request validation failed", {
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }
  return result.data;
}

/**
 * Validate a handler's response before returning it, so a bug can never send a
 * malformed payload to the client. Failure is an `internal` error, not the caller's fault.
 */
export function validateResponse<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Response validation failed: ${result.error.message}`);
  }
  return result.data;
}

export { z };
