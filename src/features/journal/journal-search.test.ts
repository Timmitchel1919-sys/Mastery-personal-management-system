import { describe, expect, it } from "vitest";
import { filterJournalEntries } from "./journal-search";
import type { JournalEntry } from "./schema";

function makeEntry(over: Partial<JournalEntry> & Pick<JournalEntry, "id">): JournalEntry {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: "2026-09-02T10:00:00.000Z",
    updatedAt: "2026-09-02T10:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title: over.title ?? "",
    entryType: over.entryType ?? "free-form",
    entryDate: "2026-09-02",
    content: over.content ?? "",
    gratitudeItems: over.gratitudeItems ?? [],
    moodRating: 3,
    energyLevel: 3,
    pillarIds: [],
    goalId: null,
    tags: over.tags ?? [],
    isPrivate: false,
  };
}

describe("filterJournalEntries", () => {
  const entries = [
    makeEntry({ id: "a", title: "Big win", content: "Shipped the launch today." }),
    makeEntry({ id: "b", entryType: "gratitude", gratitudeItems: ["My mentor"] }),
    makeEntry({ id: "c", tags: ["work", "focus"], content: "Quiet day." }),
  ];

  it("returns everything with no filter", () => {
    expect(filterJournalEntries(entries, { query: "", entryType: "all" })).toHaveLength(3);
  });

  it("matches a substring in the title or content, case-insensitively", () => {
    expect(filterJournalEntries(entries, { query: "LAUNCH", entryType: "all" })).toEqual([
      entries[0],
    ]);
  });

  it("matches a gratitude item", () => {
    expect(filterJournalEntries(entries, { query: "mentor", entryType: "all" })).toEqual([
      entries[1],
    ]);
  });

  it("matches a tag", () => {
    expect(filterJournalEntries(entries, { query: "focus", entryType: "all" })).toEqual([
      entries[2],
    ]);
  });

  it("filters by entry type", () => {
    expect(filterJournalEntries(entries, { query: "", entryType: "gratitude" })).toEqual([
      entries[1],
    ]);
  });

  it("combines a type filter with a query", () => {
    expect(filterJournalEntries(entries, { query: "quiet", entryType: "gratitude" })).toEqual([]);
  });
});
