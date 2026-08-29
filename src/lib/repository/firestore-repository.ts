import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy as fbOrderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where as fbWhere,
  type QueryConstraint,
} from "firebase/firestore";
import type { ZodType } from "zod";
import { getFirebaseClient } from "@/lib/firebase/client";
import { makeConverter } from "@/lib/firebase";
import { AppError, mapFirebaseError } from "@/lib/errors";
import type { BaseRecord } from "./base-record";
import { buildCreateAudit, buildUpdateAudit } from "./audit";
import { clampLimit, DEFAULT_PAGE_SIZE, type ListOptions, type Page } from "./pagination";

export interface RepositoryConfig<TEntity extends BaseRecord, TCreate, TUpdate> {
  /** Firestore subcollection under `users/{uid}/` — e.g. `"goals"`. */
  collectionName: string;
  /** Full entity schema (extends `baseRecordSchema`). Used for reads. */
  schema: ZodType<TEntity>;
  /** Validates user input for `create` (feature fields only, no audit fields). */
  createSchema: ZodType<TCreate>;
  /** Validates user input for `update` (a partial patch). */
  updateSchema: ZodType<TUpdate>;
  defaultOrderBy?: string;
  defaultDirection?: "asc" | "desc";
}

export interface Repository<TEntity extends BaseRecord, TCreate, TUpdate> {
  list(options?: ListOptions): Promise<Page<TEntity>>;
  get(id: string): Promise<TEntity | null>;
  create(input: TCreate): Promise<TEntity>;
  update(id: string, patch: TUpdate): Promise<TEntity>;
  archive(id: string): Promise<void>;
  unarchive(id: string): Promise<void>;
}

/**
 * Build a user-scoped Firestore repository for one subcollection.
 *
 * - The authenticated uid is resolved internally from the client auth state; callers
 *   never pass a user id.
 * - Every write stamps audit fields (`createdAt/By`, `updatedAt/By`, `version`, `status`,
 *   `archivedAt`); `version` is server-incremented on update.
 * - Reads run through a Zod-validated, Timestamp-normalizing converter.
 * - `list` is always bounded and cursor-paginated.
 */
export function createFirestoreRepository<TEntity extends BaseRecord, TCreate, TUpdate>(
  config: RepositoryConfig<TEntity, TCreate, TUpdate>,
): Repository<TEntity, TCreate, TUpdate> {
  const {
    collectionName,
    schema,
    createSchema,
    updateSchema,
    defaultOrderBy = "updatedAt",
    defaultDirection = "desc",
  } = config;

  const converter = makeConverter(schema);

  function requireUid(): string {
    const uid = getFirebaseClient().auth.currentUser?.uid;
    if (!uid) {
      throw new AppError("You must be signed in to do that", { code: "unauthenticated" });
    }
    return uid;
  }

  function docRef(uid: string, id: string) {
    return doc(getFirebaseClient().db, "users", uid, collectionName, id);
  }

  function typedCollection(uid: string) {
    return collection(getFirebaseClient().db, "users", uid, collectionName).withConverter(
      converter,
    );
  }

  async function readOne(id: string): Promise<TEntity | null> {
    const uid = requireUid();
    try {
      const snapshot = await getDoc(docRef(uid, id).withConverter(converter));
      return snapshot.exists() ? snapshot.data() : null;
    } catch (error) {
      throw mapFirebaseError(error);
    }
  }

  return {
    get: readOne,

    async list(options = {}) {
      const uid = requireUid();
      const limitValue = clampLimit(options.limit ?? DEFAULT_PAGE_SIZE);
      const orderField = options.orderBy ?? defaultOrderBy;
      const direction = options.direction ?? defaultDirection;

      try {
        const constraints: QueryConstraint[] = [
          ...(options.filters ?? []).map((filter) =>
            fbWhere(filter.field, filter.op, filter.value),
          ),
          fbOrderBy(orderField, direction),
        ];

        if (options.cursor) {
          const cursorSnapshot = await getDoc(docRef(uid, options.cursor));
          if (cursorSnapshot.exists()) {
            constraints.push(startAfter(cursorSnapshot));
          }
        }

        // Fetch one extra row to detect whether another page exists.
        constraints.push(fbLimit(limitValue + 1));

        const snapshot = await getDocs(query(typedCollection(uid), ...constraints));
        const hasMore = snapshot.docs.length > limitValue;
        const pageDocs = hasMore ? snapshot.docs.slice(0, limitValue) : snapshot.docs;

        return {
          items: pageDocs.map((entry) => entry.data()),
          nextCursor: hasMore ? (pageDocs[pageDocs.length - 1]?.id ?? null) : null,
          hasMore,
        };
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },

    async create(input) {
      const data = createSchema.parse(input);
      const uid = requireUid();
      const ref = doc(collection(getFirebaseClient().db, "users", uid, collectionName));

      try {
        await setDoc(ref, {
          ...(data as object),
          id: ref.id,
          userId: uid,
          ...buildCreateAudit(uid),
        });
        // Read back so the returned entity has real server timestamps, matching get()/list().
        const snapshot = await getDoc(ref.withConverter(converter));
        if (!snapshot.exists()) {
          throw new AppError(`${collectionName} record was missing immediately after create`, {
            code: "unavailable",
          });
        }
        return snapshot.data();
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },

    async update(id, patch) {
      const data = updateSchema.parse(patch);
      const uid = requireUid();

      try {
        await updateDoc(docRef(uid, id), {
          ...(data as object),
          ...buildUpdateAudit(uid),
        });
      } catch (error) {
        throw mapFirebaseError(error);
      }

      const updated = await readOne(id);
      if (!updated) {
        throw new AppError(`${collectionName} record ${id} was not found after update`, {
          code: "not-found",
        });
      }
      return updated;
    },

    async archive(id) {
      const uid = requireUid();
      try {
        await updateDoc(docRef(uid, id), {
          status: "archived",
          archivedAt: serverTimestamp(),
          ...buildUpdateAudit(uid),
        });
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },

    async unarchive(id) {
      const uid = requireUid();
      try {
        await updateDoc(docRef(uid, id), {
          status: "active",
          archivedAt: null,
          ...buildUpdateAudit(uid),
        });
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },
  };
}
