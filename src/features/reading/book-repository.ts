import { createFirestoreRepository } from "@/lib/repository";
import {
  bookCreateSchema,
  bookSchema,
  bookUpdateSchema,
  type Book,
  type BookCreate,
  type BookUpdate,
} from "./schema";

export const bookRepository = createFirestoreRepository<Book, BookCreate, BookUpdate>({
  collectionName: "books",
  schema: bookSchema,
  createSchema: bookCreateSchema,
  updateSchema: bookUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "asc",
});

/** Bounded fetch of active (non-archived) books. */
export async function listActiveBooks(limit = 200): Promise<Book[]> {
  const page = await bookRepository.list({
    limit,
    orderBy: "createdAt",
    direction: "asc",
  });
  return page.items.filter((book) => book.status === "active");
}
