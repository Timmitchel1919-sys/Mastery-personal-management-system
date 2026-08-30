"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { PlanOption } from "@/features/plans";
import { GoalForm } from "./GoalForm";
import type { Goal, GoalFormValues } from "../schema";

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  planOptions: PlanOption[];
  onSubmit: (values: GoalFormValues) => Promise<void>;
}

export function GoalDialog({ open, onOpenChange, goal, planOptions, onSubmit }: GoalDialogProps) {
  const editing = Boolean(goal);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit goal" : "New goal"}</DialogTitle>
          <DialogDescription>
            Measurable goals hang off a plan and roll up to your life pillars.
          </DialogDescription>
        </DialogHeader>
        <GoalForm
          key={goal?.id ?? "new"}
          planOptions={planOptions}
          submitLabel={editing ? "Save changes" : "Create goal"}
          defaultValues={
            goal
              ? {
                  title: goal.title,
                  description: goal.description,
                  pillarIds: goal.pillarIds,
                  parentPlanId: goal.parentPlanId ?? "",
                  startDate: goal.startDate ?? "",
                  targetDate: goal.targetDate ?? "",
                  goalStatus: goal.goalStatus,
                  priority: goal.priority,
                  progress: goal.progress,
                  measurementType: goal.measurementType,
                  targetValue: goal.targetValue,
                  currentValue: goal.currentValue,
                  unit: goal.unit,
                  reviewFrequency: goal.reviewFrequency,
                  notes: goal.notes,
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
