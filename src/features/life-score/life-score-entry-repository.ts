import { createFirestoreRepository } from "@/lib/repository";
import {
  lifeScoreEntryCreateSchema,
  lifeScoreEntrySchema,
  lifeScoreEntryUpdateSchema,
  type LifeScoreEntry,
  type LifeScoreEntryCreate,
  type LifeScoreEntryUpdate,
} from "./schema";

export const lifeScoreEntryRepository = createFirestoreRepository<
  LifeScoreEntry,
  LifeScoreEntryCreate,
  LifeScoreEntryUpdate
>({
  collectionName: "lifeScoreEntries",
  schema: lifeScoreEntrySchema,
  createSchema: lifeScoreEntryCreateSchema,
  updateSchema: lifeScoreEntryUpdateSchema,
  defaultOrderBy: "date",
  defaultDirection: "desc",
});

/** Bounded fetch of the user's saved Life Score history (active only), most recent first. */
export async function listRecentLifeScoreEntries(limit = 180): Promise<LifeScoreEntry[]> {
  const page = await lifeScoreEntryRepository.list({
    limit,
    orderBy: "date",
    direction: "desc",
  });
  return page.items.filter((entry) => entry.status === "active");
}
