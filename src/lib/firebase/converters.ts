import {
  serverTimestamp,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from "firebase/firestore";
import type { ZodType } from "zod";
import { AppError } from "@/lib/errors";
import { normalizeTimestamps } from "./timestamps";

/**
 * Build a typed, validated Firestore converter from a Zod schema.
 *
 * - `fromFirestore` normalizes Timestamps to ISO strings, injects the document `id`,
 *   and validates with the schema — throwing a normalized {@link AppError} on mismatch
 *   so a corrupt document never flows into the UI as an unknown shape.
 * - `toFirestore` drops `id` (it lives in the document path) and refreshes `updatedAt`
 *   with a server timestamp. Other audit fields are set by the repository layer.
 */
export function makeConverter<T extends { id: string }>(
  schema: ZodType<T>,
): FirestoreDataConverter<T> {
  return {
    toFirestore(model): DocumentData {
      const { id: _id, ...rest } = model as T & Record<string, unknown>;
      void _id;
      return { ...rest, updatedAt: serverTimestamp() };
    },

    fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options?: SnapshotOptions): T {
      const raw = normalizeTimestamps(snapshot.data(options ?? {}));
      const parsed = schema.safeParse({ ...raw, id: snapshot.id });

      if (!parsed.success) {
        throw new AppError(`Firestore document at ${snapshot.ref.path} failed validation`, {
          code: "invalid-input",
          context: {
            path: snapshot.ref.path,
            issues: parsed.error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
          },
        });
      }

      return parsed.data;
    },
  };
}
