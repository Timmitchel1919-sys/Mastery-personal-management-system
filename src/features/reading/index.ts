export {
  READING_STATUSES,
  READING_STATUS_LABEL,
  MAX_HIGHLIGHTS,
  MAX_LESSONS,
  MAX_ACTION_ITEMS,
  readingStatusSchema,
  bookSchema,
  bookCreateSchema,
  bookUpdateSchema,
  bookFormSchema,
  bookInputFromForm,
  emptyHighlight,
  emptyActionItem,
  readingProgressPercent,
  type Book,
  type BookCreate,
  type BookUpdate,
  type BookFormValues,
  type ReadingStatus,
  type Highlight,
  type ActionItem,
} from "./schema";
export { summarizeReading, type ReadingStats } from "./reading-stats";
export { bookRepository, listActiveBooks } from "./book-repository";
export { useReading } from "./use-reading";
export { ReadingView } from "./components/ReadingView";
