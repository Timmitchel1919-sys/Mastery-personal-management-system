import { z } from "zod";
import { createFirestoreRepository, defineRecordSchema } from "@/lib/repository";

/**
 * Quick Notes — a small, self-contained dashboard capture list. Stored at
 * `users/{uid}/quickNotes/{id}` and governed by the generic audit-enforced
 * subcollection rules (Layer 6).
 */
export const quickNoteSchema = defineRecordSchema({
  body: z.string().trim().min(1).max(2000),
});
export type QuickNote = z.infer<typeof quickNoteSchema>;

export const quickNoteCreateSchema = z.object({
  body: z.string().trim().min(1, "Write something first").max(2000, "That note is too long"),
});
export type QuickNoteCreate = z.infer<typeof quickNoteCreateSchema>;

export const quickNoteUpdateSchema = quickNoteCreateSchema.partial();
export type QuickNoteUpdate = z.infer<typeof quickNoteUpdateSchema>;

export const quickNoteRepository = createFirestoreRepository<
  QuickNote,
  QuickNoteCreate,
  QuickNoteUpdate
>({
  collectionName: "quickNotes",
  schema: quickNoteSchema,
  createSchema: quickNoteCreateSchema,
  updateSchema: quickNoteUpdateSchema,
  defaultOrderBy: "updatedAt",
  defaultDirection: "desc",
});
