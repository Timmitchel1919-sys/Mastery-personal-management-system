import { createFirestoreRepository } from "@/lib/repository";
import {
  goalCreateSchema,
  goalSchema,
  goalUpdateSchema,
  type Goal,
  type GoalCreate,
  type GoalUpdate,
} from "./schema";

export const goalRepository = createFirestoreRepository<Goal, GoalCreate, GoalUpdate>({
  collectionName: "goals",
  schema: goalSchema,
  createSchema: goalCreateSchema,
  updateSchema: goalUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "asc",
});

export async function listActiveGoals(): Promise<Goal[]> {
  const page = await goalRepository.list({
    limit: 100,
    orderBy: "createdAt",
    direction: "asc",
  });
  return page.items.filter((goal) => goal.status === "active");
}
