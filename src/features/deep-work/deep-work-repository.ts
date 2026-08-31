import { createFirestoreRepository } from "@/lib/repository";
import {
  deepWorkCreateSchema,
  deepWorkSessionSchema,
  deepWorkUpdateSchema,
  type DeepWorkCreate,
  type DeepWorkSession,
  type DeepWorkUpdate,
} from "./schema";

export const deepWorkRepository = createFirestoreRepository<
  DeepWorkSession,
  DeepWorkCreate,
  DeepWorkUpdate
>({
  collectionName: "focusSessions",
  schema: deepWorkSessionSchema,
  createSchema: deepWorkCreateSchema,
  updateSchema: deepWorkUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "desc",
});

/** Most recent sessions first, active (non-archived) only. Bounded. */
export async function listRecentDeepWork(limit = 30): Promise<DeepWorkSession[]> {
  const page = await deepWorkRepository.list({
    limit,
    orderBy: "createdAt",
    direction: "desc",
  });
  return page.items.filter((session) => session.status === "active");
}
