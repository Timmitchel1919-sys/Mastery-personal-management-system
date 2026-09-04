import { createFirestoreRepository } from "@/lib/repository";
import {
  journalEntryCreateSchema,
  journalEntrySchema,
  journalEntryUpdateSchema,
  type JournalEntry,
  type JournalEntryCreate,
  type JournalEntryUpdate,
} from "./schema";

export const journalRepository = createFirestoreRepository<
  JournalEntry,
  JournalEntryCreate,
  JournalEntryUpdate
>({
  collectionName: "journalEntries",
  schema: journalEntrySchema,
  createSchema: journalEntryCreateSchema,
  updateSchema: journalEntryUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "desc",
});

/** Bounded fetch of the user's most recent journal entries, newest first, active only. */
export async function listRecentJournalEntries(limit = 200): Promise<JournalEntry[]> {
  const page = await journalRepository.list({
    limit,
    orderBy: "createdAt",
    direction: "desc",
  });
  return page.items.filter((entry) => entry.status === "active");
}
