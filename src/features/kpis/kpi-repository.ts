import { createFirestoreRepository } from "@/lib/repository";
import {
  kpiCreateSchema,
  kpiSchema,
  kpiUpdateSchema,
  type Kpi,
  type KpiCreate,
  type KpiUpdate,
} from "./schema";

export const kpiRepository = createFirestoreRepository<Kpi, KpiCreate, KpiUpdate>({
  collectionName: "kpis",
  schema: kpiSchema,
  createSchema: kpiCreateSchema,
  updateSchema: kpiUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "asc",
});

/** Bounded fetch of active (non-archived) KPI definitions. */
export async function listActiveKpis(limit = 100): Promise<Kpi[]> {
  const page = await kpiRepository.list({
    limit,
    orderBy: "createdAt",
    direction: "asc",
  });
  return page.items.filter((kpi) => kpi.status === "active");
}
