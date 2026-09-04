import { createFirestoreRepository } from "@/lib/repository";
import {
  habitCreateSchema,
  habitSchema,
  habitUpdateSchema,
  type Habit,
  type HabitCreate,
  type HabitUpdate,
} from "./schema";

export const habitRepository = createFirestoreRepository<Habit, HabitCreate, HabitUpdate>({
  collectionName: "habits",
  schema: habitSchema,
  createSchema: habitCreateSchema,
  updateSchema: habitUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "asc",
});

/** Bounded fetch of active (non-archived) habits. */
export async function listActiveHabits(limit = 100): Promise<Habit[]> {
  const page = await habitRepository.list({
    limit,
    orderBy: "createdAt",
    direction: "asc",
  });
  return page.items.filter((habit) => habit.status === "active");
}

export interface HabitOption {
  id: string;
  title: string;
}

/** Active habits as `{ id, title }` — for pickers that link something to a habit. */
export async function listHabitOptions(): Promise<HabitOption[]> {
  return (await listActiveHabits()).map((habit) => ({ id: habit.id, title: habit.title }));
}
