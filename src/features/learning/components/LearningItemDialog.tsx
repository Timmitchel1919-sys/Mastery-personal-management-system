"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { GoalOption } from "@/features/goals";
import { LearningItemForm } from "./LearningItemForm";
import type { LearningItem, LearningItemFormValues } from "../schema";

interface LearningItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: LearningItem | null;
  goalOptions: GoalOption[];
  onSubmit: (values: LearningItemFormValues) => Promise<void>;
}

export function LearningItemDialog({
  open,
  onOpenChange,
  item,
  goalOptions,
  onSubmit,
}: LearningItemDialogProps) {
  const editing = Boolean(item);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit learning item" : "New learning item"}</DialogTitle>
          <DialogDescription>
            A course, study plan, book study, or certification track.
          </DialogDescription>
        </DialogHeader>
        <LearningItemForm
          key={item?.id ?? "new"}
          goalOptions={goalOptions}
          submitLabel={editing ? "Save changes" : "Add item"}
          defaultValues={
            item
              ? {
                  title: item.title,
                  description: item.description,
                  itemType: item.itemType,
                  learningStatus: item.learningStatus,
                  provider: item.provider,
                  targetCompletionDate: item.targetCompletionDate ?? "",
                  resourcesText: item.resources.join("\n"),
                  lessons: item.lessons,
                  assessmentNotes: item.assessmentNotes,
                  notes: item.notes,
                  pillarIds: item.pillarIds,
                  goalId: item.goalId ?? "",
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
