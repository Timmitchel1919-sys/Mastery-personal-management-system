"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { getCalendarProvider } from "./calendar-provider";
import {
  monthMatrix,
  navigate,
  periodLabel,
  viewRange,
  weekDates,
  type CalendarViewMode,
} from "./calendar-range";
import { expandEvents } from "./recurrence";
import type { CalendarEvent, CalendarEventCreate, CalendarEventUpdate } from "./schema";

type Status = "loading" | "ready" | "error";

export function useCalendar() {
  const { status: authStatus } = useAuth();
  const provider = useMemo(() => getCalendarProvider(), []);

  const [view, setView] = useState<CalendarViewMode>("month");
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const range = useMemo(() => viewRange(view, anchor), [view, anchor]);
  const fromIso = range.start.toISOString();
  const toIso = range.end.toISOString();

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    // The internal provider returns a bounded set of all active events regardless of the
    // window; an external provider would use it. Recurring series are expanded client-side.
    provider.listEvents({ from: fromIso, to: toIso }).then(
      (loaded) => {
        if (cancelled) return;
        setEvents(loaded);
        setStatus("ready");
        setError(null);
      },
      (caught) => {
        if (cancelled) return;
        setStatus("error");
        setError(normalizeError(caught).message);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [authStatus, refreshToken, provider, fromIso, toIso]);

  const reload = useCallback(() => setRefreshToken((token) => token + 1), []);

  const days = useMemo<Date[]>(() => {
    if (view === "day") return [anchor];
    if (view === "week") return weekDates(anchor);
    return monthMatrix(anchor).flat();
  }, [view, anchor]);

  const occurrences = useMemo(() => expandEvents(events, range.start, range.end), [events, range]);

  const label = useMemo(() => periodLabel(view, anchor), [view, anchor]);

  const goToday = useCallback(() => setAnchor(new Date()), []);
  const goPrev = useCallback(() => setAnchor((current) => navigate(view, current, -1)), [view]);
  const goNext = useCallback(() => setAnchor((current) => navigate(view, current, 1)), [view]);

  const create = useCallback(
    async (input: CalendarEventCreate) => {
      const created = await provider.createEvent(input);
      setEvents((current) => [created, ...current]);
      return created;
    },
    [provider],
  );

  const update = useCallback(
    async (id: string, patch: CalendarEventUpdate) => {
      const updated = await provider.updateEvent(id, patch);
      setEvents((current) => current.map((event) => (event.id === id ? updated : event)));
      return updated;
    },
    [provider],
  );

  const remove = useCallback(
    async (id: string) => {
      await provider.deleteEvent(id);
      setEvents((current) => current.filter((event) => event.id !== id));
    },
    [provider],
  );

  return {
    status,
    error,
    reload,
    view,
    setView,
    anchor,
    setAnchor,
    label,
    days,
    range,
    occurrences,
    goToday,
    goPrev,
    goNext,
    create,
    update,
    remove,
  };
}
