import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema } from "@/lib/validation";
import { lifePillarSchema } from "@/lib/validation/domain";

/**
 * Reading (Layer 11C) — `users/{uid}/books`. A reading-list entry: status (want to read /
 * currently reading / completed / abandoned), page-based progress, user-entered
 * highlights, lessons, and action items, plus goal/life-pillar linkage.
 *
 * **Every text field here is user-entered.** Per spec, the app must never reproduce
 * copyrighted book content the user did not supply — there is no ISBN/metadata lookup, no
 * auto-fetched synopsis or cover art, and no AI summarization of a book. Highlights are
 * verbatim quotes the user chooses to type in themselves, same as their own notes.
 */

export const READING_STATUSES = [
  "want-to-read",
  "currently-reading",
  "completed",
  "abandoned",
] as const;
export const readingStatusSchema = z.enum(READING_STATUSES);
export type ReadingStatus = (typeof READING_STATUSES)[number];

export const READING_STATUS_LABEL: Record<ReadingStatus, string> = {
  "want-to-read": "Want to read",
  "currently-reading": "Currently reading",
  completed: "Completed",
  abandoned: "Abandoned",
};

export const MAX_HIGHLIGHTS = 100;
export const MAX_LESSONS = 20;
export const MAX_ACTION_ITEMS = 30;

const readingPillarsSchema = z.array(lifePillarSchema).max(3);

const highlightSchema = z.object({
  id: z.string().trim().min(1).max(64),
  quote: z.string().trim().min(1, "Enter the highlight").max(2000),
  pageNumber: z.number().int().min(0).max(20_000).nullable(),
});
export type Highlight = z.infer<typeof highlightSchema>;

const actionItemSchema = z.object({
  id: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1, "Name the action item").max(200),
  completed: z.boolean(),
});
export type ActionItem = z.infer<typeof actionItemSchema>;

const lessonSchema = z.string().trim().min(1).max(300);

const bookFieldsSchema = z.object({
  title: z.string().trim().min(1, "Give the book a title").max(300),
  author: z.string().trim().max(200),
  readingStatus: readingStatusSchema,
  currentPage: z.number().int().min(0).max(20_000),
  totalPages: z.number().int().min(0).max(20_000).nullable(),
  startedDate: isoDateSchema.nullable(),
  completedDate: isoDateSchema.nullable(),
  highlights: z.array(highlightSchema).max(MAX_HIGHLIGHTS),
  lessons: z.array(lessonSchema).max(MAX_LESSONS),
  actionItems: z.array(actionItemSchema).max(MAX_ACTION_ITEMS),
  notes: z.string().trim().max(4000),
  pillarIds: readingPillarsSchema,
  goalId: z.string().trim().min(1).nullable(),
});

const pageOrderIssue = { path: ["currentPage"], message: "Current page can't exceed the total" };
const pagesOrdered = (data: { currentPage: number; totalPages: number | null }) =>
  data.totalPages === null || data.currentPage <= data.totalPages;

export const bookSchema = defineRecordSchema(bookFieldsSchema.shape);
export type Book = z.infer<typeof bookSchema>;

export const bookCreateSchema = bookFieldsSchema.refine(pagesOrdered, pageOrderIssue);
export type BookCreate = z.infer<typeof bookCreateSchema>;

export const bookUpdateSchema = bookFieldsSchema.partial();
export type BookUpdate = z.infer<typeof bookUpdateSchema>;

function newId(prefix: string): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyHighlight(): Highlight {
  return { id: newId("highlight"), quote: "", pageNumber: null };
}

export function emptyActionItem(): ActionItem {
  return { id: newId("action"), title: "", completed: false };
}

/** 0–100, or `null` when no total page count is set. Pure. */
export function readingProgressPercent(
  book: Pick<Book, "currentPage" | "totalPages">,
): number | null {
  if (!book.totalPages) return null;
  return Math.max(0, Math.min(100, Math.round((book.currentPage / book.totalPages) * 100)));
}

// ── Form shape ────────────────────────────────────────────────────────────────
const highlightFormSchema = z.object({
  id: z.string().trim().min(1).max(64),
  quote: z.string().trim().min(1, "Enter the highlight").max(2000),
  pageNumber: z.number().int().min(0).max(20_000).nullable(),
});
const actionItemFormSchema = z.object({
  id: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1, "Name the action item").max(200),
  completed: z.boolean(),
});

export const bookFormSchema = z
  .object({
    title: z.string().trim().min(1, "Give the book a title").max(300),
    author: z.string().trim().max(200),
    readingStatus: readingStatusSchema,
    currentPage: z.number().int().min(0).max(20_000),
    totalPages: z.number().int().min(0).max(20_000),
    startedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Pick a date"),
    completedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Pick a date"),
    highlights: z.array(highlightFormSchema).max(MAX_HIGHLIGHTS),
    lessonsText: z.string().trim().max(3000),
    actionItems: z.array(actionItemFormSchema).max(MAX_ACTION_ITEMS),
    notes: z.string().trim().max(4000),
    pillarIds: readingPillarsSchema,
    goalId: z.string(),
  })
  .refine((d) => d.totalPages === 0 || d.currentPage <= d.totalPages, {
    path: ["currentPage"],
    message: "Current page can't exceed the total",
  });
export type BookFormValues = z.infer<typeof bookFormSchema>;

function linesToList(text: string, max: number): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, max);
}

export function bookInputFromForm(values: BookFormValues): BookCreate {
  return {
    title: values.title,
    author: values.author,
    readingStatus: values.readingStatus,
    currentPage: values.currentPage,
    totalPages: values.totalPages || null,
    startedDate: values.startedDate || null,
    completedDate: values.completedDate || null,
    highlights: values.highlights,
    lessons: linesToList(values.lessonsText, MAX_LESSONS),
    actionItems: values.actionItems,
    notes: values.notes,
    pillarIds: values.pillarIds,
    goalId: values.goalId || null,
  };
}
