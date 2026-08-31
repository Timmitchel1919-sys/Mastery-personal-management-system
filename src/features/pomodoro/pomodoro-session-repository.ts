import { createFirestoreRepository } from "@/lib/repository";
import {
  pomodoroSessionCreateSchema,
  pomodoroSessionSchema,
  pomodoroSessionUpdateSchema,
  type PomodoroSession,
  type PomodoroSessionCreate,
  type PomodoroSessionUpdate,
} from "./schema";

export const pomodoroSessionRepository = createFirestoreRepository<
  PomodoroSession,
  PomodoroSessionCreate,
  PomodoroSessionUpdate
>({
  collectionName: "pomodoroSessions",
  schema: pomodoroSessionSchema,
  createSchema: pomodoroSessionCreateSchema,
  updateSchema: pomodoroSessionUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "desc",
});

/** Most recent sessions first. Bounded — no unbounded reads, no listener. */
export async function listRecentSessions(limit = 20): Promise<PomodoroSession[]> {
  const page = await pomodoroSessionRepository.list({
    limit,
    orderBy: "createdAt",
    direction: "desc",
  });
  return page.items;
}
