"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { GoalOption } from "@/features/goals";
import { JournalEntryForm } from "./JournalEntryForm";
import type { JournalEntry, JournalEntryFormValues } from "../schema";

interface JournalEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: JournalEntry | null;
  goalOptions: GoalOption[];
  onSubmit: (values: JournalEntryFormValues) => Promise<void>;
}

export function JournalEntryDialog({
  open,
  onOpenChange,
  entry,
  goalOptions,
  onSubmit,
}: JournalEntryDialogProps) {
  const editing = Boolean(entry);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit entry" : "New journal entry"}</DialogTitle>
          <DialogDescription>Write freely, or follow the prompt for this type.</DialogDescription>
        </DialogHeader>
        <JournalEntryForm
          key={entry?.id ?? "new"}
          goalOptions={goalOptions}
          submitLabel={editing ? "Save changes" : "Add entry"}
          defaultValues={
            entry
              ? {
                  title: entry.title,
                  entryType: entry.entryType,
                  entryDate: entry.entryDate,
                  content: entry.content,
                  gratitudeItemsText: entry.gratitudeItems.join("\n"),
                  moodRating: entry.moodRating,
                  energyLevel: entry.energyLevel,
                  pillarIds: entry.pillarIds,
                  goalId: entry.goalId ?? "",
                  tagsText: entry.tags.join(", "),
                  isPrivate: entry.isPrivate,
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
