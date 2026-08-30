import { z } from "zod";

/**
 * Shared Zod building blocks used across feature schemas. Feature-specific schemas
 * live in `src/features/<feature>/schema.ts` and compose from these.
 */

export const nonEmptyString = z.string().trim().min(1);

export const idSchema = z.string().trim().min(1).max(128);

export const isoDateTimeSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Expected an ISO 8601 date-time string",
});

/** Calendar date only, `YYYY-MM-DD` (planning tiers are date-granular). */
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a YYYY-MM-DD date");

export const paginationQuerySchema = z.object({
  limit: z.number().int().positive().max(100).default(20),
  cursor: z.string().trim().min(1).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export * from "./domain";

export { z };
