import { createFirestoreRepository } from "@/lib/repository";
import {
  kpiEntryCreateSchema,
  kpiEntrySchema,
  kpiEntryUpdateSchema,
  type KpiEntry,
  type KpiEntryCreate,
  type KpiEntryUpdate,
} from "./schema";

export const kpiEntryRepository = createFirestoreRepository<
  KpiEntry,
  KpiEntryCreate,
  KpiEntryUpdate
>({
  collectionName: "kpiEntries",
  schema: kpiEntrySchema,
  createSchema: kpiEntryCreateSchema,
  updateSchema: kpiEntryUpdateSchema,
  defaultOrderBy: "date",
  defaultDirection: "desc",
});

/**
 * Bounded fetch of the user's most recent KPI entries across all KPIs (active only).
 * Grouping by `kpiId` happens client-side — avoids a composite index, the same trade-off
 * habit/routine/skill logs make.
 */
export async function listRecentKpiEntries(limit = 500): Promise<KpiEntry[]> {
  const page = await kpiEntryRepository.list({
    limit,
    orderBy: "date",
    direction: "desc",
  });
  return page.items.filter((entry) => entry.status === "active");
}
