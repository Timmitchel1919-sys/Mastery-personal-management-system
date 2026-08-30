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
import { MilestoneForm } from "./MilestoneForm";
import type { Milestone, MilestoneFormValues } from "../schema";

interface MilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone?: Milestone | null;
  goalOptions: GoalOption[];
  projectOptions: ProjectOption[];
  onSubmit: (values: MilestoneFormValues) => Promise<void>;
}

export function MilestoneDialog({
  open,
  onOpenChange,
  milestone,
  goalOptions,
  projectOptions,
  onSubmit,
}: MilestoneDialogProps) {
  const editing = Boolean(milestone);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit milestone" : "New milestone"}</DialogTitle>
          <DialogDescription>
            A milestone is a checkpoint on the way to a goal or project.
          </DialogDescription>
        </DialogHeader>
        <MilestoneForm
          key={milestone?.id ?? "new"}
          goalOptions={goalOptions}
          projectOptions={projectOptions}
          submitLabel={editing ? "Save changes" : "Create milestone"}
          defaultValues={
            milestone
              ? {
                  title: milestone.title,
                  description: milestone.description,
                  pillarIds: milestone.pillarIds,
                  parentType: milestone.parentType,
                  parentId: milestone.parentId ?? "",
                  dueDate: milestone.dueDate ?? "",
                  milestoneStatus: milestone.milestoneStatus,
                  progress: milestone.progress,
                  dependencies: milestone.dependencies,
                  evidence: milestone.evidence,
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
