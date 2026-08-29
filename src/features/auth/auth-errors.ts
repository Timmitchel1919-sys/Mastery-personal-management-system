import { AppError, mapFirebaseError, type ErrorCode } from "@/lib/errors";

/**
 * User-facing message for an auth failure. Copy is English-only here; Layer 18 routes
 * these through the i18n layer by key. Keep messages non-leaky and actionable.
 */
const MESSAGE_BY_FIREBASE_CODE: Record<string, string> = {
  "auth/invalid-email": "That email address looks invalid.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account was found with those details.",
  "auth/wrong-password": "The email or password is incorrect.",
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Choose a stronger password (at least 8 characters).",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
  "auth/network-request-failed": "Network problem. Check your connection and try again.",
  "auth/popup-closed-by-user": "The sign-in window was closed before finishing.",
  "auth/cancelled-popup-request": "Another sign-in attempt is already in progress.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups and retry.",
  "auth/account-exists-with-different-credential":
    "This email is already linked to a different sign-in method.",
  "auth/requires-recent-login": "Please sign in again to complete this action.",
};

const MESSAGE_BY_CODE: Partial<Record<ErrorCode, string>> = {
  network: "Network problem. Check your connection and try again.",
  "rate-limited": "Too many attempts. Wait a moment and try again.",
  unavailable: "The service is temporarily unavailable. Try again shortly.",
  "permission-denied": "You do not have permission to do that.",
  unauthenticated: "Please sign in and try again.",
};

/** Convert any auth failure into a normalized `AppError` with a friendly message. */
export function toAuthError(value: unknown): AppError {
  const appError = mapFirebaseError(value);
  const firebaseCode =
    typeof appError.context?.["firebaseCode"] === "string"
      ? (appError.context["firebaseCode"] as string)
      : undefined;

  const message =
    (firebaseCode && MESSAGE_BY_FIREBASE_CODE[firebaseCode]) ??
    MESSAGE_BY_CODE[appError.code] ??
    "Something went wrong. Please try again.";

  return new AppError(message, {
    code: appError.code,
    cause: appError.cause ?? appError,
    context: appError.context,
  });
}

/** Extract a display string from any thrown value. */
export function authErrorMessage(value: unknown): string {
  return toAuthError(value).message;
}
