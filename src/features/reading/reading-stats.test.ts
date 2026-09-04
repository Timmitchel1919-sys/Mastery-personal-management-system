import { describe, expect, it } from "vitest";
import { summarizeReading } from "./reading-stats";
import type { Book } from "./schema";

function makeBook(over: Partial<Book> & Pick<Book, "id">): Book {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title: "Book",
    author: "",
    readingStatus: over.readingStatus ?? "want-to-read",
    currentPage: 0,
    totalPages: null,
    startedDate: null,
    completedDate: over.completedDate ?? null,
    highlights: [],
    lessons: [],
    actionItems: [],
    notes: "",
    pillarIds: [],
    goalId: null,
  };
}

describe("summarizeReading", () => {
  it("returns zeros for no books", () => {
    expect(summarizeReading([], "2026-09-10")).toEqual({
      total: 0,
      currentlyReading: 0,
      wantToRead: 0,
      completed: 0,
      completedLast30Days: 0,
    });
  });

  it("counts each status and recent completions", () => {
    const stats = summarizeReading(
      [
        makeBook({ id: "a", readingStatus: "currently-reading" }),
        makeBook({ id: "b", readingStatus: "want-to-read" }),
        makeBook({ id: "c", readingStatus: "completed", completedDate: "2026-09-05" }),
        makeBook({ id: "d", readingStatus: "completed", completedDate: "2026-01-01" }),
        makeBook({ id: "e", readingStatus: "abandoned" }),
      ],
      "2026-09-10",
    );
    expect(stats).toEqual({
      total: 5,
      currentlyReading: 1,
      wantToRead: 1,
      completed: 2,
      completedLast30Days: 1,
    });
  });
});
