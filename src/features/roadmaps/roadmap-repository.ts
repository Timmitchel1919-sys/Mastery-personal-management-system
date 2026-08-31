import { createFirestoreRepository } from "@/lib/repository";
import {
  roadmapCreateSchema,
  roadmapSchema,
  roadmapUpdateSchema,
  type Roadmap,
  type RoadmapCreate,
  type RoadmapUpdate,
} from "./schema";

export const roadmapRepository = createFirestoreRepository<Roadmap, RoadmapCreate, RoadmapUpdate>({
  collectionName: "roadmaps",
  schema: roadmapSchema,
  createSchema: roadmapCreateSchema,
  updateSchema: roadmapUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "asc",
});

export async function listActiveRoadmaps(): Promise<Roadmap[]> {
  const page = await roadmapRepository.list({
    limit: 100,
    orderBy: "createdAt",
    direction: "asc",
  });
  return page.items.filter((roadmap) => roadmap.status === "active");
}
