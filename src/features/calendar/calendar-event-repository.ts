import { createFirestoreRepository } from "@/lib/repository";
import {
  eventCreateSchema,
  eventSchema,
  eventUpdateSchema,
  type CalendarEvent,
  type CalendarEventCreate,
  type CalendarEventUpdate,
} from "./schema";

export const calendarEventRepository = createFirestoreRepository<
  CalendarEvent,
  CalendarEventCreate,
  CalendarEventUpdate
>({
  collectionName: "events",
  schema: eventSchema,
  createSchema: eventCreateSchema,
  updateSchema: eventUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "desc",
});

/**
 * Bounded fetch of active events. Recurring events are expanded client-side against the
 * visible range (see `recurrence.ts`), so a date-window Firestore query would miss series
 * that started outside the window — hence a plain bounded read for now. A range-indexed
 * query for non-recurring events is a later optimisation.
 */
export async function listActiveEvents(limit = 300): Promise<CalendarEvent[]> {
  const page = await calendarEventRepository.list({
    limit,
    orderBy: "createdAt",
    direction: "desc",
  });
  return page.items.filter((event) => event.status === "active");
}
