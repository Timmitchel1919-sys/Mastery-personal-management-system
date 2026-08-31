import { calendarEventRepository, listActiveEvents } from "./calendar-event-repository";
import type { CalendarEvent, CalendarEventCreate, CalendarEventUpdate } from "./schema";

/**
 * Calendar source adapter. The internal Firestore calendar implements this; a future
 * Google / Outlook / CalDAV sync can implement the same interface without touching the
 * views or the event model (Final Master Prompt §9C — "build behind an adapter interface").
 */
export interface CalendarRangeQuery {
  /** Inclusive ISO instant. */
  from: string;
  /** Exclusive ISO instant. */
  to: string;
}

export interface CalendarProvider {
  readonly id: string;
  readonly label: string;
  /**
   * Return every event that could produce an occurrence in `[from, to)`. Recurring series
   * are returned whole; the caller expands them. Implementations must stay bounded.
   */
  listEvents(query: CalendarRangeQuery): Promise<CalendarEvent[]>;
  createEvent(input: CalendarEventCreate): Promise<CalendarEvent>;
  updateEvent(id: string, patch: CalendarEventUpdate): Promise<CalendarEvent>;
  deleteEvent(id: string): Promise<void>;
}

export const internalCalendarProvider: CalendarProvider = {
  id: "internal",
  label: "Mastery calendar",
  async listEvents() {
    return listActiveEvents(300);
  },
  createEvent(input) {
    return calendarEventRepository.create(input);
  },
  updateEvent(id, patch) {
    return calendarEventRepository.update(id, patch);
  },
  async deleteEvent(id) {
    await calendarEventRepository.archive(id);
  },
};

/** The active calendar source. External providers slot in here once sync exists. */
export function getCalendarProvider(): CalendarProvider {
  return internalCalendarProvider;
}
