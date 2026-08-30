import { createFirestoreRepository } from "@/lib/repository";
import {
  milestoneCreateSchema,
  milestoneSchema,
  milestoneUpdateSchema,
  type Milestone,
  type MilestoneCreate,
  type MilestoneUpdate,
} from "./schema";

export const milestoneRepository = createFirestoreRepository<
  Milestone,
  MilestoneCreate,
  MilestoneUpdate
>({
  collectionName: "milestones",
  schema: milestoneSchema,
  createSchema: milestoneCreateSchema,
  updateSchema: milestoneUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "asc",
});

export async function listActiveMilestones(): Promise<Milestone[]> {
  const page = await milestoneRepository.list({
    limit: 100,
    orderBy: "createdAt",
    direction: "asc",
  });
  return page.items.filter((milestone) => milestone.status === "active");
}
