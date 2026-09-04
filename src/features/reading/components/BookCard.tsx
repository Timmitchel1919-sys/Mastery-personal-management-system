"use client";

import { useState } from "react";
import { Link2, Pencil, Quote, Trash2 } from "lucide-react";
import { PillarBadges } from "@/components/shared";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IconButton,
  Progress,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  READING_STATUS_LABEL,
  readingProgressPercent,
  type Book,
  type ReadingStatus,
} from "../schema";

const STATUS_VARIANT: Record<ReadingStatus, "neutral" | "primary" | "success" | "warning"> = {
  "want-to-read": "neutral",
  "currently-reading": "primary",
  completed: "success",
  abandoned: "warning",
};

interface BookCardProps {
  book: Book;
  goalTitleById: Map<string, string>;
  onEdit: (book: Book) => void;
  onArchive: (id: string) => Promise<void>;
  onToggleActionItem: (book: Book, itemId: string) => Promise<unknown>;
}

export function BookCard({
  book,
  goalTitleById,
  onEdit,
  onArchive,
  onToggleActionItem,
}: BookCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const percent = readingProgressPercent(book);
  const link = book.goalId ? goalTitleById.get(book.goalId) : undefined;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={STATUS_VARIANT[book.readingStatus]}>
                {READING_STATUS_LABEL[book.readingStatus]}
              </Badge>
              {percent !== null ? <Badge variant="outline">{percent}%</Badge> : null}
            </div>
            <h3 className="mt-1 font-medium break-words">{book.title}</h3>
            {book.author ? <p className="text-subtle text-sm">{book.author}</p> : null}
          </div>
          <div className="flex shrink-0 gap-0.5">
            <IconButton
              size="sm"
              aria-label="Edit book"
              icon={<Pencil />}
              onClick={() => onEdit(book)}
            />
            <IconButton
              size="sm"
              aria-label="Archive book"
              icon={<Trash2 />}
              onClick={() => setConfirmOpen(true)}
            />
          </div>
        </div>

        {percent !== null ? <Progress value={percent} /> : null}

        <div className="text-subtle flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {book.totalPages ? (
            <span>
              {book.currentPage}/{book.totalPages} pages
            </span>
          ) : null}
          {book.startedDate ? <span>started {book.startedDate}</span> : null}
          {book.completedDate ? <span>completed {book.completedDate}</span> : null}
          {link ? (
            <span className="inline-flex items-center gap-1">
              <Link2 className="size-3.5" aria-hidden="true" />
              {link}
            </span>
          ) : null}
        </div>

        {book.highlights.length > 0 ? (
          <div className="space-y-1.5">
            {book.highlights.map((highlight) => (
              <blockquote
                key={highlight.id}
                className="border-border-strong text-subtle border-l-2 pl-2 text-sm italic"
              >
                <Quote className="mr-1 inline size-3" aria-hidden="true" />
                {highlight.quote}
                {highlight.pageNumber !== null ? (
                  <span className="text-subtle not-italic"> (p.{highlight.pageNumber})</span>
                ) : null}
              </blockquote>
            ))}
          </div>
        ) : null}

        {book.lessons.length > 0 ? (
          <ul className="list-disc space-y-0.5 pl-5 text-sm">
            {book.lessons.map((lesson, index) => (
              <li key={index}>{lesson}</li>
            ))}
          </ul>
        ) : null}

        {book.actionItems.length > 0 ? (
          <ul className="space-y-1">
            {book.actionItems.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={item.completed}
                  aria-label={`${item.title}${item.completed ? " (done)" : ""}`}
                  onCheckedChange={() => onToggleActionItem(book, item.id)}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 break-words",
                    item.completed && "text-subtle line-through",
                  )}
                >
                  {item.title}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {book.notes ? (
          <p className="text-muted text-sm break-words whitespace-pre-wrap">{book.notes}</p>
        ) : null}

        {book.pillarIds.length > 0 ? <PillarBadges pillars={book.pillarIds} /> : null}
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this book?</DialogTitle>
            <DialogDescription>
              It is removed from your reading list. This does not delete the record.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="danger"
              loading={archiving}
              onClick={async () => {
                setArchiving(true);
                try {
                  await onArchive(book.id);
                  setConfirmOpen(false);
                } finally {
                  setArchiving(false);
                }
              }}
            >
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
