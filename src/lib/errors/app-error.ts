export const ERROR_CODES = [
  "unknown",
  "network",
  "timeout",
  "not-found",
  "permission-denied",
  "unauthenticated",
  "invalid-input",
  "conflict",
  "rate-limited",
  "unavailable",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

const RETRYABLE_CODES = new Set<ErrorCode>(["network", "timeout", "rate-limited", "unavailable"]);

export interface AppErrorOptions {
  code?: ErrorCode;
  cause?: unknown;
  retryable?: boolean;
  context?: Record<string, unknown>;
}

/**
 * Normalized application error. Every caught error is converted to this shape so the UI
 * can branch on a stable `code` and `retryable` flag instead of provider-specific errors.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly context: Record<string, unknown> | undefined;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "AppError";
    this.code = options.code ?? "unknown";
    this.retryable = options.retryable ?? RETRYABLE_CODES.has(this.code);
    this.context = options.context;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      retryable: this.retryable,
    };
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

/**
 * Convert any thrown value into an `AppError`. SDK-specific mappers (Firebase, Cloud
 * Functions) are layered on top of this in later layers.
 */
export function normalizeError(value: unknown): AppError {
  if (isAppError(value)) {
    return value;
  }

  if (value instanceof Error) {
    return new AppError(value.message || "Unexpected error", {
      cause: value,
      code: inferCodeFromMessage(value.message),
    });
  }

  if (typeof value === "string" && value.trim() !== "") {
    return new AppError(value, { code: "unknown" });
  }

  return new AppError("Unexpected error", { code: "unknown", context: { original: value } });
}

function inferCodeFromMessage(message: string): ErrorCode {
  const text = message.toLowerCase();
  if (text.includes("network") || text.includes("fetch failed")) return "network";
  if (text.includes("timeout") || text.includes("timed out")) return "timeout";
  if (text.includes("not found")) return "not-found";
  if (text.includes("permission")) return "permission-denied";
  if (text.includes("unauthenticated") || text.includes("unauthorized")) return "unauthenticated";
  return "unknown";
}
