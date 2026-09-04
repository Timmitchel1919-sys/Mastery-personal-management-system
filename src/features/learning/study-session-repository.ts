import { createFirestoreRepository } from "@/lib/repository";
import {
  studySessionCreateSchema,
  studySessionSchema,
  studySessionUpdateSchema,
  type StudySession,
  type StudySessionCreate,
  type StudySessionUpdate,
} from "./schema";

export const studySessionRepository = createFirestoreRepository<
  StudySession,
  StudySessionCreate,
  StudySessionUpdate
>({
  collectionName: "studySessions",
  schema: studySessionSchema,
  createSchema: studySessionCreateSchema,
  updateSchema: studySessionUpdateSchema,
  defaultOrderBy: "date",
  defaultDirection: "desc",
});

/** Bounded fetch of the user's most recent study sessions, newest first, active only. */
export async function listRecentStudySessions(limit = 200): Promise<StudySession[]> {
  const page = await studySessionRepository.list({
    limit,
    orderBy: "date",
    direction: "desc",
  });
  return page.items.filter((session) => session.status === "active");
}
