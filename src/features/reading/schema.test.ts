import { describe, expect, it } from "vitest";
import {
  bookCreateSchema,
  bookFormSchema,
  bookInputFromForm,
  bookSchema,
  bookUpdateSchema,
  emptyActionItem,
  emptyHighlight,
  readingProgressPercent,
  type BookFormValues,
} from "./schema";

const full = {
  title: "Deep Work",
  author: "Cal Newport",
  readingStatus: "currently-reading" as const,
  currentPage: 50,
  totalPages: 200,
  startedDate: "2026-09-01",
  completedDate: null,
  highlights: [{ id: "h1", quote: "Focus is a skill.", pageNumber: 12 }],
  lessons: ["Protect deep work blocks"],
  actionItems: [{ id: "a1", title: "Block 2h tomorrow", completed: false }],
  notes: "",
  pillarIds: ["personal" as const],
  goalId: null,
};

describe("bookCreateSchema", () => {
  it("accepts a fully specified book", () => {
    expect(bookCreateSchema.parse(full).title).toBe("Deep Work");
  });

  it("requires a title and rejects an unknown status", () => {
    expect(bookCreateSchema.safeParse({ ...full, title: "" }).success).toBe(false);
    expect(bookCreateSchema.safeParse({ ...full, readingStatus: "skimming" }).success).toBe(false);
  });

  it("rejects a current page beyond the total", () => {
    expect(bookCreateSchema.safeParse({ ...full, currentPage: 300, totalPages: 200 }).success).toBe(
      false,
    );
  });

  it("allows a null total page count regardless of current page", () => {
    expect(
      bookCreateSchema.safeParse({ ...full, totalPages: null, currentPage: 999 }).success,
    ).toBe(true);
  });

  it("requires every highlight and action item to have content", () => {
    expect(
      bookCreateSchema.safeParse({
        ...full,
        highlights: [{ id: "h1", quote: "", pageNumber: null }],
      }).success,
    ).toBe(false);
    expect(
      bookCreateSchema.safeParse({
        ...full,
        actionItems: [{ id: "a1", title: "", completed: false }],
      }).success,
    ).toBe(false);
  });
});

describe("bookUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(bookUpdateSchema.safeParse({}).success).toBe(true);
    expect(bookUpdateSchema.safeParse({ readingStatus: "completed" }).success).toBe(true);
  });
});

describe("emptyHighlight + emptyActionItem", () => {
  it("generate fresh ids each time", () => {
    expect(emptyHighlight().id).not.toBe(emptyHighlight().id);
    expect(emptyActionItem().id).not.toBe(emptyActionItem().id);
  });
});

describe("readingProgressPercent", () => {
  it("is null with no total page count", () => {
    expect(readingProgressPercent({ currentPage: 10, totalPages: null })).toBeNull();
  });

  it("computes a clamped percentage", () => {
    expect(readingProgressPercent({ currentPage: 50, totalPages: 200 })).toBe(25);
    expect(readingProgressPercent({ currentPage: 250, totalPages: 200 })).toBe(100);
  });
});

describe("bookFormSchema + bookInputFromForm", () => {
  const form: BookFormValues = {
    title: "Atomic Habits",
    author: "",
    readingStatus: "want-to-read",
    currentPage: 0,
    totalPages: 0,
    startedDate: "",
    completedDate: "",
    highlights: [],
    lessonsText: "Small habits compound\n\nStart tiny",
    actionItems: [],
    notes: "",
    pillarIds: [],
    goalId: "",
  };

  it("validates the form shape", () => {
    expect(bookFormSchema.safeParse(form).success).toBe(true);
  });

  it("rejects a current page beyond a non-zero total", () => {
    expect(bookFormSchema.safeParse({ ...form, currentPage: 10, totalPages: 5 }).success).toBe(
      false,
    );
  });

  it("maps a zero total to null pages, splits lessons, and blank dates/goal to null", () => {
    const input = bookInputFromForm(form);
    expect(input.totalPages).toBeNull();
    expect(input.startedDate).toBeNull();
    expect(input.goalId).toBeNull();
    expect(input.lessons).toEqual(["Small habits compound", "Start tiny"]);
    expect(bookCreateSchema.safeParse(input).success).toBe(true);
  });
});

describe("bookSchema", () => {
  it("validates a stored record", () => {
    const record = bookSchema.parse({
      id: "b1",
      ...full,
      status: "active",
      version: 1,
      createdAt: "2026-09-02T10:00:00.000Z",
      updatedAt: "2026-09-02T10:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
    });
    expect(record.readingStatus).toBe("currently-reading");
  });
});
