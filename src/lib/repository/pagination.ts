import { z } from "zod";
import type { WhereFilterOp } from "firebase/firestore";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Programmatic list options for a repository query. */
export interface ListOptions {
  limit?: number;
  /** Opaque cursor from a previous page (`Page.nextCursor`). */
  cursor?: string;
  /** Field to order by (default: the repository's `defaultOrderBy`, usually `updatedAt`). */
  orderBy?: string;
  direction?: "asc" | "desc";
  /** Extra Firestore `where` constraints. Composite queries need a matching index. */
  filters?: FieldFilter[];
}

export interface FieldFilter {
  field: string;
  op: WhereFilterOp;
  value: unknown;
}

export interface Page<T> {
  items: T[];
  /** Pass to the next `list({ cursor })` call. `null` when there are no more pages. */
  nextCursor: string | null;
  hasMore: boolean;
}

/** Validates a paginated *request payload* (e.g. from a URL or a callable function). */
export const pageQuerySchema = z.object({
  limit: z.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  cursor: z.string().trim().min(1).optional(),
  orderBy: z.string().trim().min(1).optional(),
  direction: z.enum(["asc", "desc"]).optional(),
});

export type PageQuery = z.infer<typeof pageQuerySchema>;

export function clampLimit(limit: number | undefined): number {
  if (limit === undefined || Number.isNaN(limit)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(Math.trunc(limit), 1), MAX_PAGE_SIZE);
}
