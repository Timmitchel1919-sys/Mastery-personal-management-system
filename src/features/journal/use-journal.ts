"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { journalRepository, listRecentJournalEntries } from "./journal-repository";
import { DEFAULT_JOURNAL_FILTER, filterJournalEntries, type JournalFilter } from "./journal-search";
import { summarizeJournal, type JournalStats } from "./journal-stats";
import type { JournalEntry, JournalEntryCreate, JournalEntryUpdate } from "./schema";

type Status = "loading" | "ready" | "error";

export function useJournal() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<JournalEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [filter, setFilter] = useState<JournalFilter>(DEFAULT_JOURNAL_FILTER);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    listRecentJournalEntries().then(
      (loaded) => {
        if (cancelled) return;
        setItems(loaded);
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
  }, [authStatus, refreshToken]);

  const reload = useCallback(() => setRefreshToken((token) => token + 1), []);

  const create = useCallback(async (input: JournalEntryCreate) => {
    const created = await journalRepository.create(input);
    setItems((current) => [created, ...current]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: JournalEntryUpdate) => {
    const updated = await journalRepository.update(id, patch);
    setItems((current) => current.map((entry) => (entry.id === id ? updated : entry)));
    return updated;
  }, []);

  const archive = useCallback(async (id: string) => {
    await journalRepository.archive(id);
    setItems((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const filteredItems = useMemo(() => filterJournalEntries(items, filter), [items, filter]);
  const stats: JournalStats = useMemo(() => summarizeJournal(items), [items]);

  return {
    status,
    items,
    filteredItems,
    filter,
    setFilter,
    stats,
    error,
    reload,
    create,
    update,
    archive,
  };
}
