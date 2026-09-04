import type { Book } from "./schema";

export interface ReadingStats {
  total: number;
  currentlyReading: number;
  wantToRead: number;
  completed: number;
  completedLast30Days: number;
}

function daysAgo(dateIso: string, todayIso: string): number {
  return (Date.parse(`${todayIso}T00:00:00Z`) - Date.parse(`${dateIso}T00:00:00Z`)) / 86_400_000;
}

/** Roll a set of books into headline stats. Pure. */
export function summarizeReading(
  books: Book[],
  today: string = new Date().toISOString().slice(0, 10),
): ReadingStats {
  let currentlyReading = 0;
  let wantToRead = 0;
  let completed = 0;
  let completedLast30Days = 0;

  for (const book of books) {
    if (book.readingStatus === "currently-reading") currentlyReading += 1;
    if (book.readingStatus === "want-to-read") wantToRead += 1;
    if (book.readingStatus === "completed") {
      completed += 1;
      if (book.completedDate) {
        const age = daysAgo(book.completedDate, today);
        if (age >= 0 && age < 30) completedLast30Days += 1;
      }
    }
  }

  return {
    total: books.length,
    currentlyReading,
    wantToRead,
    completed,
    completedLast30Days,
  };
}
