import { AppError, type ErrorCode } from "./app-error";

interface CodedError {
  code?: unknown;
  message?: unknown;
}

function hasStringCode(value: unknown): value is { code: string; message?: string } {
  return (
    typeof value === "object" && value !== null && typeof (value as CodedError).code === "string"
  );
}

/** Firestore / callable gRPC status codes and common Auth / Storage codes → AppError codes. */
const CODE_MAP: Record<string, ErrorCode> = {
  // gRPC status (Firestore, callable functions)
  "permission-denied": "permission-denied",
  unauthenticated: "unauthenticated",
  "not-found": "not-found",
  "already-exists": "conflict",
  aborted: "conflict",
  "failed-precondition": "conflict",
  "invalid-argument": "invalid-input",
  "out-of-range": "invalid-input",
  "deadline-exceeded": "timeout",
  unavailable: "unavailable",
  "resource-exhausted": "rate-limited",
  cancelled: "unknown",
  unknown: "unknown",
  internal: "unknown",
  "data-loss": "unknown",
  unimplemented: "unknown",

  // Auth
  "auth/invalid-email": "invalid-input",
  "auth/missing-password": "invalid-input",
  "auth/weak-password": "invalid-input",
  "auth/user-disabled": "permission-denied",
  "auth/user-not-found": "not-found",
  "auth/wrong-password": "unauthenticated",
  "auth/invalid-credential": "unauthenticated",
  "auth/requires-recent-login": "unauthenticated",
  "auth/email-already-in-use": "conflict",
  "auth/account-exists-with-different-credential": "conflict",
  "auth/too-many-requests": "rate-limited",
  "auth/network-request-failed": "network",
  "auth/popup-closed-by-user": "unknown",
  "auth/cancelled-popup-request": "unknown",
  "auth/operation-not-allowed": "permission-denied",

  // Storage
  "storage/unauthorized": "permission-denied",
  "storage/unauthenticated": "unauthenticated",
  "storage/object-not-found": "not-found",
  "storage/quota-exceeded": "rate-limited",
  "storage/retry-limit-exceeded": "timeout",
  "storage/canceled": "unknown",
};

/** Strip a leading service prefix like `firestore/` while keeping `auth/` and `storage/`. */
function baseCode(code: string): string {
  const slash = code.indexOf("/");
  if (slash === -1) return code;
  const head = code.slice(0, slash);
  return head === "auth" || head === "storage" ? code : code.slice(slash + 1);
}

/**
 * Normalize any Firebase SDK error (Auth, Firestore, Storage) or callable-function
 * error into the app-wide {@link AppError} shape.
 */
export function mapFirebaseError(value: unknown): AppError {
  if (value instanceof AppError) return value;

  if (hasStringCode(value)) {
    const raw = value.code;
    const mapped = CODE_MAP[raw] ?? CODE_MAP[baseCode(raw)] ?? "unknown";
    return new AppError(value.message ?? "Firebase request failed", {
      code: mapped,
      cause: value,
      context: { firebaseCode: raw },
    });
  }

  if (value instanceof Error) {
    return new AppError(value.message || "Firebase request failed", {
      code: "unknown",
      cause: value,
    });
  }

  return new AppError("Firebase request failed", {
    code: "unknown",
    context: { original: value },
  });
}

/** Cloud Functions callable errors use the same gRPC status codes as Firestore. */
export const mapFunctionsError = mapFirebaseError;
