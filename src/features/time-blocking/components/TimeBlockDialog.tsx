"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { isoToWall } from "@/features/calendar";
import type { GoalOption } from "@/features/goals";
import type { ProjectOption } from "@/features/projects";
import { TimeBlockForm } from "./TimeBlockForm";
import type { TimeBlock, TimeBlockFormValues } from "../schema";

interface TimeBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block?: TimeBlock | null;
  goalOptions: GoalOption[];
  projectOptions: ProjectOption[];
  onSubmit: (values: TimeBlockFormValues) => Promise<void>;
}

function wall(iso: string, zone: string): string {
  const { date, time } = isoToWall(iso, zone);
  return `${date}T${time}`;
}

export function TimeBlockDialog({
  open,
  onOpenChange,
  block,
  goalOptions,
  projectOptions,
  onSubmit,
}: TimeBlockDialogProps) {
  const editing = Boolean(block);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit time block" : "New time block"}</DialogTitle>
          <DialogDescription>
            Allocate a time range to an activity. Overlapping blocks are flagged.
          </DialogDescription>
        </DialogHeader>
        <TimeBlockForm
          key={block?.id ?? "new"}
          goalOptions={goalOptions}
          projectOptions={projectOptions}
          submitLabel={editing ? "Save changes" : "Add block"}
          defaultValues={
            block
              ? {
                  title: block.title,
                  category: block.category,
                  timeZone: block.timeZone,
                  startWall: wall(block.startDateTime, block.timeZone),
                  endWall: wall(block.endDateTime, block.timeZone),
                  pillarIds: block.pillarIds,
                  goalId: block.goalId ?? "",
                  projectId: block.projectId ?? "",
                  notes: block.notes,
                  blockStatus: block.blockStatus,
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
