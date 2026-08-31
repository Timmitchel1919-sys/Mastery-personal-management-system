import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import {
  calendarEventRepository,
  listActiveEvents,
} from "@/features/calendar/calendar-event-repository";
import { getCalendarProvider } from "@/features/calendar/calendar-provider";
import { expandEvents } from "@/features/calendar/recurrence";
import type { CalendarEventCreate } from "@/features/calendar/schema";

const PROJECT_ID = "demo-mastery";
const AUTH_HOST = "http://127.0.0.1:9099";
const FIRESTORE_HOST = "http://127.0.0.1:8080";

async function resetEmulators() {
  await fetch(`${AUTH_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: "DELETE" });
  await fetch(
    `${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: "DELETE" },
  );
}

function uniqueEmail(tag: string) {
  return `${tag}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function signUpFresh(tag: string) {
  return authService.signUpWithEmail({
    email: uniqueEmail(tag),
    password: "sup3rsecret",
    displayName: tag,
  });
}

function timedEvent(over: Partial<CalendarEventCreate> = {}): CalendarEventCreate {
  return {
    title: "Team sync",
    description: "",
    location: "",
    allDay: false,
    timeZone: "UTC",
    startDateTime: "2026-09-01T09:00:00+00:00",
    endDateTime: "2026-09-01T09:30:00+00:00",
    startDate: null,
    endDate: null,
    recurrence: null,
    reminders: [10],
    goalId: null,
    projectId: null,
    ...over,
  };
}

beforeEach(async () => {
  await resetEmulators();
  await authService.signOut().catch(() => {});
});

afterAll(async () => {
  await authService.signOut().catch(() => {});
});

describe("calendar provider (internal)", () => {
  it("creates, lists, updates, and archives events through the adapter", async () => {
    const user = await signUpFresh("alice");
    const provider = getCalendarProvider();

    const created = await provider.createEvent(
      timedEvent({
        title: "Weekly review",
        recurrence: { frequency: "weekly", interval: 1, weekdays: [], count: 5, until: null },
      }),
    );
    expect(created.createdBy).toBe(user.uid);

    const events = await provider.listEvents({
      from: "2026-09-01T00:00:00Z",
      to: "2026-10-01T00:00:00Z",
    });
    expect(events.map((event) => event.title)).toEqual(["Weekly review"]);

    // The recurring event expands to 5 weekly occurrences within a wide window.
    const occurrences = expandEvents(
      events,
      new Date("2026-09-01T00:00:00Z"),
      new Date("2026-12-01T00:00:00Z"),
    );
    expect(occurrences).toHaveLength(5);

    const updated = await provider.updateEvent(created.id, { title: "Weekly retro" });
    expect(updated.title).toBe("Weekly retro");

    await provider.deleteEvent(created.id);
    expect(await listActiveEvents(50)).toHaveLength(0);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await calendarEventRepository.create(timedEvent({ title: "Private event" }));
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listActiveEvents(50)).toHaveLength(0);
  });
});
