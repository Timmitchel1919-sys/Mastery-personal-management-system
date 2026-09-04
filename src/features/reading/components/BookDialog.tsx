"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { GoalOption } from "@/features/goals";
import { BookForm } from "./BookForm";
import type { Book, BookFormValues } from "../schema";

interface BookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book?: Book | null;
  goalOptions: GoalOption[];
  onSubmit: (values: BookFormValues) => Promise<void>;
}

export function BookDialog({ open, onOpenChange, book, goalOptions, onSubmit }: BookDialogProps) {
  const editing = Boolean(book);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit book" : "New book"}</DialogTitle>
          <DialogDescription>
            Your own notes, highlights, and takeaways — nothing is fetched for you.
          </DialogDescription>
        </DialogHeader>
        <BookForm
          key={book?.id ?? "new"}
          goalOptions={goalOptions}
          submitLabel={editing ? "Save changes" : "Add book"}
          defaultValues={
            book
              ? {
                  title: book.title,
                  author: book.author,
                  readingStatus: book.readingStatus,
                  currentPage: book.currentPage,
                  totalPages: book.totalPages ?? 0,
                  startedDate: book.startedDate ?? "",
                  completedDate: book.completedDate ?? "",
                  highlights: book.highlights,
                  lessonsText: book.lessons.join("\n"),
                  actionItems: book.actionItems,
                  notes: book.notes,
                  pillarIds: book.pillarIds,
                  goalId: book.goalId ?? "",
                }
              : undefined
          }
          onSubmit={async (values) => {
            await onSubmit(values);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
