import { createFirestoreRepository } from "@/lib/repository";
import {
  reportCreateSchema,
  reportSchema,
  reportUpdateSchema,
  type Report,
  type ReportCreate,
  type ReportUpdate,
} from "./report-schema";

/**
 * `users/{uid}/reports` — export metadata only (see `report-schema.ts`). Client-written
 * under the generic owner-only rule; there is no server mediation because a metadata
 * record carries no sensitive content.
 */
export const reportRepository = createFirestoreRepository<Report, ReportCreate, ReportUpdate>({
  collectionName: "reports",
  schema: reportSchema,
  createSchema: reportCreateSchema,
  updateSchema: reportUpdateSchema,
  defaultOrderBy: "generatedAt",
  defaultDirection: "desc",
});

/** Most recent report records, newest first. */
export async function listRecentReports(limit = 30): Promise<Report[]> {
  const page = await reportRepository.list({
    limit,
    orderBy: "generatedAt",
    direction: "desc",
  });
  return page.items.filter((report) => report.status === "active");
}
