import { createFirestoreRepository } from "@/lib/repository";
import {
  routineCreateSchema,
  routineSchema,
  routineUpdateSchema,
  type Routine,
  type RoutineCreate,
  type RoutineUpdate,
} from "./schema";

export const routineRepository = createFirestoreRepository<Routine, RoutineCreate, RoutineUpdate>({
  collectionName: "routines",
  schema: routineSchema,
  createSchema: routineCreateSchema,
  updateSchema: routineUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "asc",
});

/** Bounded fetch of active (non-archived) routines. */
export async function listActiveRoutines(limit = 100): Promise<Routine[]> {
  const page = await routineRepository.list({
    limit,
    orderBy: "createdAt",
    direction: "asc",
  });
  return page.items.filter((routine) => routine.status === "active");
}
