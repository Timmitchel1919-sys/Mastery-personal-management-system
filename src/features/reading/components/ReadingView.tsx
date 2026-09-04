"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button, Skeleton } from "@/components/ui";
import { useGoalOptions } from "@/features/goals";
import { useReading } from "../use-reading";
import {
  READING_STATUSES,
  READING_STATUS_LABEL,
  bookInputFromForm,
  type Book,
  type ReadingStatus,
} from "../schema";
import { BookCard } from "./BookCard";
import { BookDialog } from "./BookDialog";
import { ReadingStats } from "./ReadingStats";

const SECTION_ORDER: ReadingStatus[] = [
  "currently-reading",
  "want-to-read",
  "completed",
  "abandoned",
];

export function ReadingView() {
  const { status, items, stats, error, reload, create, update, archive, toggleActionItem } =
    useReading();
  const { options: goalOptions } = useGoalOptions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);

  const goalTitleById = useMemo(
    () => new Map(goalOptions.map((option) => [option.id, option.title])),
    [goalOptions],
  );

  const byStatus = useMemo(() => {
    const map = new Map<ReadingStatus, Book[]>();
    for (const status of READING_STATUSES) map.set(status, []);
    for (const book of items) map.get(book.readingStatus)?.push(book);
    return map;
  }, [items]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(book: Book) {
    setEditing(book);
    setDialogOpen(true);
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Reading"
        description="Your reading list, progress, highlights, and takeaways."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button onClick={openCreate} disabled={status === "loading"}>
            <Plus />
            New book
          </Button>
        }
      />

      {status === "loading" ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-52" />
            ))}
          </div>
        </div>
      ) : status === "error" ? (
        <ErrorState
          className="min-h-[40vh]"
          title="We couldn't load your reading list"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : (
        <>
          <ReadingStats stats={stats} />

          {items.length === 0 ? (
            <EmptyState
              title="No books yet"
              description="Add a book you're reading, want to read, or have finished."
              action={
                <Button onClick={openCreate}>
                  <Plus />
                  Add your first book
                </Button>
              }
            />
          ) : (
            <div className="space-y-6">
              {SECTION_ORDER.map((sectionStatus) => {
                const books = byStatus.get(sectionStatus) ?? [];
                if (books.length === 0) return null;
                return (
                  <section key={sectionStatus} className="space-y-3">
                    <h2 className="text-subtle text-sm font-medium">
                      {READING_STATUS_LABEL[sectionStatus]}
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {books.map((book) => (
                        <BookCard
                          key={book.id}
                          book={book}
                          goalTitleById={goalTitleById}
                          onEdit={openEdit}
                          onArchive={archive}
                          onToggleActionItem={toggleActionItem}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}

      <BookDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        book={editing}
        goalOptions={goalOptions}
        onSubmit={async (values) => {
          const input = bookInputFromForm(values);
          if (editing) await update(editing.id, input);
          else await create(input);
        }}
      />
    </PageContainer>
  );
}
