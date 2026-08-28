/**
 * Duck-typed Firestore Timestamp. Matches both the client SDK
 * (`firebase/firestore`) and the Admin SDK (`firebase-admin/firestore`).
 */
interface TimestampLike {
  toDate: () => Date;
  seconds: number;
  nanoseconds: number;
}

function isTimestampLike(value: unknown): value is TimestampLike {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toDate?: unknown }).toDate === "function" &&
    typeof (value as { seconds?: unknown }).seconds === "number"
  );
}

function isPlainObject(value: object): boolean {
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

/**
 * Recursively replace Firestore Timestamps with ISO 8601 strings. Plain objects and
 * arrays are traversed; every other value passes through untouched. This is the single
 * canonical timestamp representation used above the data-access boundary.
 */
export function normalizeTimestamps<T>(value: T): T {
  if (isTimestampLike(value)) {
    return value.toDate().toISOString() as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeTimestamps(item)) as unknown as T;
  }

  if (value !== null && typeof value === "object" && isPlainObject(value)) {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      output[key] = normalizeTimestamps(entry);
    }
    return output as T;
  }

  return value;
}
