"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { HabitOption } from "@/features/habits";
import { RoutineForm } from "./RoutineForm";
import type { Routine, RoutineFormValues } from "../schema";

interface RoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine?: Routine | null;
  habitOptions: HabitOption[];
  onSubmit: (values: RoutineFormValues) => Promise<void>;
}

export function RoutineDialog({
  open,
  onOpenChange,
  routine,
  habitOptions,
  onSubmit,
}: RoutineDialogProps) {
  const editing = Boolean(routine);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit routine" : "New routine"}</DialogTitle>
          <DialogDescription>
            Lay out the steps in order — mark them off each day you run the routine.
          </DialogDescription>
        </DialogHeader>
        <RoutineForm
          key={routine?.id ?? "new"}
          habitOptions={habitOptions}
          submitLabel={editing ? "Save changes" : "Add routine"}
          defaultValues={
            routine
              ? {
                  title: routine.title,
                  description: routine.description,
                  routineType: routine.routineType,
                  pillarIds: routine.pillarIds,
                  isTemplate: routine.isTemplate,
                  steps: routine.steps.map((step) => ({
                    id: step.id,
                    title: step.title,
                    estimatedMinutes: step.estimatedMinutes,
                    habitId: step.habitId ?? "",
                  })),
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
