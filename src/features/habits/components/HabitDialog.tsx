"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { GoalOption } from "@/features/goals";
import { HabitForm } from "./HabitForm";
import type { Habit, HabitFormValues } from "../schema";

interface HabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit | null;
  goalOptions: GoalOption[];
  onSubmit: (values: HabitFormValues) => Promise<void>;
}

export function HabitDialog({
  open,
  onOpenChange,
  habit,
  goalOptions,
  onSubmit,
}: HabitDialogProps) {
  const editing = Boolean(habit);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit habit" : "New habit"}</DialogTitle>
          <DialogDescription>
            Set how often it&rsquo;s expected — the streak is derived from your logs automatically.
          </DialogDescription>
        </DialogHeader>
        <HabitForm
          key={habit?.id ?? "new"}
          goalOptions={goalOptions}
          submitLabel={editing ? "Save changes" : "Add habit"}
          defaultValues={
            habit
              ? {
                  title: habit.title,
                  description: habit.description,
                  pillarIds: habit.pillarIds,
                  goalId: habit.goalId ?? "",
                  frequency: habit.frequency,
                  interval: habit.interval,
                  weekdays: habit.weekdays,
                  daysOfMonthText: habit.daysOfMonth.join(", "),
                  target: habit.target,
                  unit: habit.unit,
                  reminderTime: habit.reminderTime ?? "",
                  habitStatus: habit.habitStatus,
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
