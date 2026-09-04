import type { JournalEntry, JournalEntryType } from "./schema";

export interface JournalFilter {
  query: string;
  entryType: JournalEntryType | "all";
}

export const DEFAULT_JOURNAL_FILTER: JournalFilter = { query: "", entryType: "all" };

/**
 * Client-side filter over an already-loaded, bounded entry list — a substring match
 * (case-insensitive) across title, content, tags, and gratitude items, plus an optional
 * entry-type filter. Pure.
 */
export function filterJournalEntries(
  entries: JournalEntry[],
  filter: JournalFilter,
): JournalEntry[] {
  const query = filter.query.trim().toLowerCase();

  return entries.filter((entry) => {
    if (filter.entryType !== "all" && entry.entryType !== filter.entryType) return false;
    if (!query) return true;

    const haystack = [entry.title, entry.content, ...entry.tags, ...entry.gratitudeItems]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}
