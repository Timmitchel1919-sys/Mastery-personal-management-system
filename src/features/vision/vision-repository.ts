import { createFirestoreRepository } from "@/lib/repository";
import {
  lifeVisionCreateSchema,
  lifeVisionSchema,
  lifeVisionUpdateSchema,
  type LifeVision,
  type LifeVisionCreate,
  type LifeVisionUpdate,
} from "./schema";

export const lifeVisionRepository = createFirestoreRepository<
  LifeVision,
  LifeVisionCreate,
  LifeVisionUpdate
>({
  collectionName: "lifeVisions",
  schema: lifeVisionSchema,
  createSchema: lifeVisionCreateSchema,
  updateSchema: lifeVisionUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "asc",
});

/**
 * Vision collections are small, so load the lot (bounded) and drop archived items
 * client-side — avoids a `status` composite index at this stage.
 */
export async function listActiveVisions(): Promise<LifeVision[]> {
  const page = await lifeVisionRepository.list({
    limit: 100,
    orderBy: "createdAt",
    direction: "asc",
  });
  return page.items.filter((item) => item.status === "active");
}
