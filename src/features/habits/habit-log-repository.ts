import { createFirestoreRepository } from "@/lib/repository";
import {
  habitLogCreateSchema,
  habitLogSchema,
  habitLogUpdateSchema,
  type HabitLog,
  type HabitLogCreate,
  type HabitLogUpdate,
} from "./schema";

export const habitLogRepository = createFirestoreRepository<
  HabitLog,
  HabitLogCreate,
  HabitLogUpdate
>({
  collectionName: "habitLogs",
  schema: habitLogSchema,
  createSchema: habitLogCreateSchema,
  updateSchema: habitLogUpdateSchema,
  defaultOrderBy: "date",
  defaultDirection: "desc",
});

/**
 * Bounded fetch of the user's most recent habit logs across all habits (active only).
 * Grouping by `habitId` happens client-side — avoids a composite index for
 * `where(habitId) + orderBy(date)`, the same trade-off the sibling domains make.
 */
export async function listRecentHabitLogs(limit = 500): Promise<HabitLog[]> {
  const page = await habitLogRepository.list({
    limit,
    orderBy: "date",
    direction: "desc",
  });
  return page.items.filter((log) => log.status === "active");
}
