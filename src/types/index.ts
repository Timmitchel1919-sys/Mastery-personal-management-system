/**
 * Shared domain types. Feature-local types live in `src/features/<feature>/types.ts`;
 * these are the cross-domain primitives and the data-access shapes.
 */

export type { LifePillar, Priority, RecordStatus, MeasurementType } from "@/lib/validation/domain";

export type {
  BaseRecord,
  Repository,
  RepositoryConfig,
  Page,
  PageQuery,
  ListOptions,
  FieldFilter,
} from "@/lib/repository";
