import { describe, expect, it } from "vitest";
import { summarizeJournal } from "./journal-stats";
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
    title: "",
    entryType: "free-form",
    entryDate: over.entryDate ?? "2026-09-02",
    content: "Some notes",
    gratitudeItems: [],
    moodRating: over.moodRating ?? 3,
    energyLevel: over.energyLevel ?? 3,
    pillarIds: [],
    goalId: null,
    tags: over.tags ?? [],
    isPrivate: false,
  };
}

describe("summarizeJournal", () => {
  it("returns zeros/nulls for no entries", () => {
    expect(summarizeJournal([], "2026-09-10")).toEqual({
      total: 0,
      last7Days: 0,
      avgMood: null,
      avgEnergy: null,
      distinctTags: 0,
    });
  });

  it("averages mood/energy, counts recent entries, and dedupes tags", () => {
    const stats = summarizeJournal(
      [
        makeEntry({
          id: "a",
          entryDate: "2026-09-09",
          moodRating: 4,
          energyLevel: 2,
          tags: ["work"],
        }),
        makeEntry({
          id: "b",
          entryDate: "2026-09-01",
          moodRating: 2,
          energyLevel: 4,
          tags: ["work", "rest"],
        }),
      ],
      "2026-09-10",
    );
    expect(stats.total).toBe(2);
    expect(stats.last7Days).toBe(1); // only "a" is within the trailing 7 days
    expect(stats.avgMood).toBe(3);
    expect(stats.avgEnergy).toBe(3);
    expect(stats.distinctTags).toBe(2);
  });
});
