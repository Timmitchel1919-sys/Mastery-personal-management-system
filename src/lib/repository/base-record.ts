import { z, type ZodRawShape } from "zod";
import { isoDateTimeSchema } from "@/lib/validation";
import { recordStatusSchema } from "@/lib/validation/domain";

/**
 * Audit / lifecycle fields present on every user-owned record. Feature schemas extend
 * this via {@link defineRecordSchema}. Timestamps are ISO 8601 strings at this boundary
 * (normalized from Firestore Timestamps by the converter).
 */
export const baseRecordSchema = z.object({
  id: z.string().min(1),
  /** Set on server writes / where a record needs its owner inline. */
  userId: z.string().min(1).optional(),
  status: recordStatusSchema.default("active"),
  version: z.number().int().nonnegative().default(1),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  createdBy: z.string().min(1),
  updatedBy: z.string().min(1),
  archivedAt: isoDateTimeSchema.nullable().default(null),
});

export type BaseRecord = z.infer<typeof baseRecordSchema>;

/** The audit field names — useful for stripping them from user-supplied input. */
export const BASE_RECORD_KEYS = Object.keys(baseRecordSchema.shape) as (keyof BaseRecord)[];

/**
 * Build a full entity schema by extending the base record with feature fields:
 *
 *   const goalSchema = defineRecordSchema({ title: z.string().min(1), pillarIds: lifePillarsSchema });
 *   type Goal = z.infer<typeof goalSchema>;
 */
export function defineRecordSchema<Shape extends ZodRawShape>(fields: Shape) {
  return baseRecordSchema.extend(fields);
}
