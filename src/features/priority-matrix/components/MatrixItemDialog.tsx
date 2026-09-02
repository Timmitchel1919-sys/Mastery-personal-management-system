"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { GoalOption } from "@/features/goals";
import type { ProjectOption } from "@/features/projects";
import { MatrixItemForm } from "./MatrixItemForm";
import type { MatrixItem, MatrixItemFormValues, MatrixQuadrant } from "../schema";

interface MatrixItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MatrixItem | null;
  /** Quadrant a freshly-created item lands in (ignored when editing). */
  presetQuadrant?: MatrixQuadrant;
  goalOptions: GoalOption[];
  projectOptions: ProjectOption[];
  onSubmit: (values: MatrixItemFormValues) => Promise<void>;
}

export function MatrixItemDialog({
  open,
  onOpenChange,
  item,
  presetQuadrant = "do",
  goalOptions,
  projectOptions,
  onSubmit,
}: MatrixItemDialogProps) {
  const editing = Boolean(item);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit item" : "New item"}</DialogTitle>
          <DialogDescription>
            Place it in a quadrant by urgency and importance; move it any time.
          </DialogDescription>
        </DialogHeader>
        <MatrixItemForm
          key={item?.id ?? `new-${presetQuadrant}`}
          goalOptions={goalOptions}
          projectOptions={projectOptions}
          submitLabel={editing ? "Save changes" : "Add item"}
          defaultValues={
            item
              ? {
                  title: item.title,
                  quadrant: item.quadrant,
                  note: item.note,
                  goalId: item.goalId ?? "",
                  projectId: item.projectId ?? "",
                  pillarIds: item.pillarIds,
                  completed: item.completed,
                }
              : { quadrant: presetQuadrant }
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
