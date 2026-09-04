import { createFirestoreRepository } from "@/lib/repository";
import {
  routineLogCreateSchema,
  routineLogSchema,
  routineLogUpdateSchema,
  type RoutineLog,
  type RoutineLogCreate,
  type RoutineLogUpdate,
} from "./schema";

export const routineLogRepository = createFirestoreRepository<
  RoutineLog,
  RoutineLogCreate,
  RoutineLogUpdate
>({
  collectionName: "routineLogs",
  schema: routineLogSchema,
  createSchema: routineLogCreateSchema,
  updateSchema: routineLogUpdateSchema,
  defaultOrderBy: "date",
  defaultDirection: "desc",
});

/**
 * Bounded fetch of the user's most recent routine logs across all routines (active only).
 * Grouping by `routineId` happens client-side — avoids a composite index, the same
 * trade-off the habit logs make.
 */
export async function listRecentRoutineLogs(limit = 300): Promise<RoutineLog[]> {
  const page = await routineLogRepository.list({
    limit,
    orderBy: "date",
    direction: "desc",
  });
  return page.items.filter((log) => log.status === "active");
}
