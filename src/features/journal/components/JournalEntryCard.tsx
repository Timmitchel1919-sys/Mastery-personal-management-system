"use client";

import { useState } from "react";
import { Eye, EyeOff, Link2, Pencil, Smile, Trash2, Zap } from "lucide-react";
import { PillarBadges } from "@/components/shared";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IconButton,
} from "@/components/ui";
import { JOURNAL_ENTRY_TYPE_LABEL, type JournalEntry } from "../schema";

interface JournalEntryCardProps {
  entry: JournalEntry;
  goalTitleById: Map<string, string>;
  onEdit: (entry: JournalEntry) => void;
  onArchive: (id: string) => Promise<void>;
}

export function JournalEntryCard({
  entry,
  goalTitleById,
  onEdit,
  onArchive,
}: JournalEntryCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [revealed, setRevealed] = useState(!entry.isPrivate);
  const link = entry.goalId ? goalTitleById.get(entry.goalId) : undefined;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="primary">{JOURNAL_ENTRY_TYPE_LABEL[entry.entryType]}</Badge>
              {entry.isPrivate ? <Badge variant="outline">Private</Badge> : null}
              <span className="text-subtle text-xs">{entry.entryDate}</span>
            </div>
            {entry.title ? <h3 className="mt-1 font-medium break-words">{entry.title}</h3> : null}
          </div>
          <div className="flex shrink-0 gap-0.5">
            {entry.isPrivate ? (
              <IconButton
                size="sm"
                aria-label={revealed ? "Hide entry" : "Show entry"}
                icon={revealed ? <EyeOff /> : <Eye />}
                onClick={() => setRevealed((current) => !current)}
              />
            ) : null}
            <IconButton
              size="sm"
              aria-label="Edit entry"
              icon={<Pencil />}
              onClick={() => onEdit(entry)}
            />
            <IconButton
              size="sm"
              aria-label="Archive entry"
              icon={<Trash2 />}
              onClick={() => setConfirmOpen(true)}
            />
          </div>
        </div>

        {revealed ? (
          <>
            {entry.gratitudeItems.length > 0 ? (
              <ul className="list-disc space-y-0.5 pl-5 text-sm">
                {entry.gratitudeItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : null}
            {entry.content ? (
              <p className="text-muted text-sm break-words whitespace-pre-wrap">{entry.content}</p>
            ) : null}
          </>
        ) : (
          <p className="text-subtle text-sm italic">Hidden — click the eye icon to show.</p>
        )}

        <div className="text-subtle flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1">
            <Smile className="size-3.5" aria-hidden="true" />
            mood {entry.moodRating}/5
          </span>
          <span className="inline-flex items-center gap-1">
            <Zap className="size-3.5" aria-hidden="true" />
            energy {entry.energyLevel}/5
          </span>
          {link ? (
            <span className="inline-flex items-center gap-1">
              <Link2 className="size-3.5" aria-hidden="true" />
              {link}
            </span>
          ) : null}
        </div>

        {entry.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {entry.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        {entry.pillarIds.length > 0 ? <PillarBadges pillars={entry.pillarIds} /> : null}
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this entry?</DialogTitle>
            <DialogDescription>
              It is removed from your journal. This does not delete the record.
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
                  await onArchive(entry.id);
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
