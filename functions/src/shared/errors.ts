import { HttpsError, type FunctionsErrorCode } from "firebase-functions/https";

export type { FunctionsErrorCode };
export { HttpsError };

/**
 * Convert any thrown value into an `HttpsError` that is safe to return to a client.
 * Internal error details are never leaked in the public message.
 */
export function toHttpsError(value: unknown): HttpsError {
  if (value instanceof HttpsError) return value;

  const detail = value instanceof Error ? value.message : String(value);
  return new HttpsError("internal", "An unexpected error occurred", { detail });
}

export function badRequest(message: string, details?: unknown): HttpsError {
  return new HttpsError("invalid-argument", message, details);
}

export function unauthenticated(message = "Authentication required"): HttpsError {
  return new HttpsError("unauthenticated", message);
}

export function permissionDenied(message = "You do not have access to this resource"): HttpsError {
  return new HttpsError("permission-denied", message);
}

export function notFound(message = "Resource not found"): HttpsError {
  return new HttpsError("not-found", message);
}
