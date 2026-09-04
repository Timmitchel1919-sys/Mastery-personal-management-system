import { createFirestoreRepository } from "@/lib/repository";
import {
  learningItemCreateSchema,
  learningItemSchema,
  learningItemUpdateSchema,
  type LearningItem,
  type LearningItemCreate,
  type LearningItemUpdate,
} from "./schema";

export const learningItemRepository = createFirestoreRepository<
  LearningItem,
  LearningItemCreate,
  LearningItemUpdate
>({
  collectionName: "learningItems",
  schema: learningItemSchema,
  createSchema: learningItemCreateSchema,
  updateSchema: learningItemUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "asc",
});

/** Bounded fetch of active (non-archived) learning items. */
export async function listActiveLearningItems(limit = 100): Promise<LearningItem[]> {
  const page = await learningItemRepository.list({
    limit,
    orderBy: "createdAt",
    direction: "asc",
  });
  return page.items.filter((item) => item.status === "active");
}
