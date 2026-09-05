import { createFirestoreRepository } from "@/lib/repository";
import {
  recoveryGoalCreateSchema,
  recoveryGoalSchema,
  recoveryGoalUpdateSchema,
  type RecoveryGoal,
  type RecoveryGoalCreate,
  type RecoveryGoalUpdate,
} from "./recovery-goal-schema";

export const recoveryGoalRepository = createFirestoreRepository<
  RecoveryGoal,
  RecoveryGoalCreate,
  RecoveryGoalUpdate
>({
  collectionName: "recoveryGoals",
  schema: recoveryGoalSchema,
  createSchema: recoveryGoalCreateSchema,
  updateSchema: recoveryGoalUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "asc",
});

/** Bounded fetch of active (non-archived) recovery goals. */
export async function listActiveRecoveryGoals(limit = 50): Promise<RecoveryGoal[]> {
  const page = await recoveryGoalRepository.list({
    limit,
    orderBy: "createdAt",
    direction: "asc",
  });
  return page.items.filter((goal) => goal.status === "active");
}
