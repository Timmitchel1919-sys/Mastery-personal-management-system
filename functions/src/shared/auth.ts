import type { CallableRequest } from "firebase-functions/https";
import { unauthenticated } from "./errors";

/**
 * Assert the callable request is authenticated and return the caller's uid.
 * Every callable that touches user data must call this first.
 */
export function requireAuth(request: CallableRequest<unknown>): string {
  const uid = request.auth?.uid;
  if (!uid) {
    throw unauthenticated();
  }
  return uid;
}
