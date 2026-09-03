"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { GoalOption } from "@/features/goals";
import type { MilestoneOption } from "@/features/milestones";
import type { ProjectOption } from "@/features/projects";
import { TaskForm } from "./TaskForm";
import type { Task, TaskFormValues } from "../schema";
import type { TaskOption } from "../task-repository";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  goalOptions: GoalOption[];
  projectOptions: ProjectOption[];
  milestoneOptions: MilestoneOption[];
  taskOptions: TaskOption[];
  onSubmit: (values: TaskFormValues) => Promise<void>;
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  goalOptions,
  projectOptions,
  milestoneOptions,
  taskOptions,
  onSubmit,
}: TaskDialogProps) {
  const editing = Boolean(task);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            Capture the work, its priority and dates, and how it links to your plans.
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          key={task?.id ?? "new"}
          goalOptions={goalOptions}
          projectOptions={projectOptions}
          milestoneOptions={milestoneOptions}
          taskOptions={taskOptions.filter((option) => option.id !== task?.id)}
          submitLabel={editing ? "Save changes" : "Add task"}
          defaultValues={
            task
              ? {
                  title: task.title,
                  description: task.description,
                  taskStatus: task.taskStatus,
                  priority: task.priority,
                  startDate: task.startDate ?? "",
                  dueDate: task.dueDate ?? "",
                  pillarIds: task.pillarIds,
                  goalId: task.goalId ?? "",
                  projectId: task.projectId ?? "",
                  milestoneId: task.milestoneId ?? "",
                  parentTaskId: task.parentTaskId ?? "",
                  recurrence: task.recurrence?.frequency ?? "none",
                  recurrenceInterval: task.recurrence?.interval ?? 1,
                  estimatedMinutes: task.estimatedMinutes,
                  actualMinutes: task.actualMinutes,
                  energyRequirement: task.energyRequirement,
                  context: task.context,
                  tags: task.tags,
                  notes: task.notes,
                  resolutionReason: task.resolutionReason,
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
