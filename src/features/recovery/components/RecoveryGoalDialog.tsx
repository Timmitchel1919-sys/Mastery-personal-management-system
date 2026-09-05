"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { RecoveryGoalForm } from "./RecoveryGoalForm";
import type { RecoveryGoal, RecoveryGoalFormValues } from "../recovery-goal-schema";

interface RecoveryGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: RecoveryGoal | null;
  onSubmit: (values: RecoveryGoalFormValues) => Promise<void>;
}

export function RecoveryGoalDialog({
  open,
  onOpenChange,
  goal,
  onSubmit,
}: RecoveryGoalDialogProps) {
  const editing = Boolean(goal);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit recovery goal" : "New recovery goal"}</DialogTitle>
          <DialogDescription>
            This is your private space to plan. It is not medical or psychological advice and does
            not replace a licensed professional.
          </DialogDescription>
        </DialogHeader>
        <RecoveryGoalForm
          key={goal?.id ?? "new"}
          submitLabel={editing ? "Save changes" : "Add goal"}
          defaultValues={
            goal
              ? {
                  behavior: goal.behavior,
                  description: goal.description,
                  motivation: goal.motivation,
                  startDate: goal.startDate ?? "",
                  triggersText: goal.triggers.join("\n"),
                  warningSignsText: goal.warningSigns.join("\n"),
                  copingStrategiesText: goal.copingStrategies.join("\n"),
                  supportNotes: goal.supportNotes,
                  faithBasedEncouragement: goal.faithBasedEncouragement,
                  recoveryStatus: goal.recoveryStatus,
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
