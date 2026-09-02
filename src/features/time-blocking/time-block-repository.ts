import { createFirestoreRepository } from "@/lib/repository";
import {
  timeBlockCreateSchema,
  timeBlockSchema,
  timeBlockUpdateSchema,
  type TimeBlock,
  type TimeBlockCreate,
  type TimeBlockUpdate,
} from "./schema";

export const timeBlockRepository = createFirestoreRepository<
  TimeBlock,
  TimeBlockCreate,
  TimeBlockUpdate
>({
  collectionName: "timeBlocks",
  schema: timeBlockSchema,
  createSchema: timeBlockCreateSchema,
  updateSchema: timeBlockUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "desc",
});

/**
 * Bounded fetch of active (non-archived) time blocks, sorted chronologically by start
 * instant so the day-grouped view is in schedule order. Sorting is done client-side to
 * avoid a composite index; the working set is expected to be small.
 */
export async function listActiveTimeBlocks(limit = 200): Promise<TimeBlock[]> {
  const page = await timeBlockRepository.list({
    limit,
    orderBy: "createdAt",
    direction: "desc",
  });
  return page.items
    .filter((block) => block.status === "active")
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
}
