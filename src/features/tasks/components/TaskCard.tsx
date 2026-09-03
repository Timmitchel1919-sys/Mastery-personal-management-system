"use client";

import { useState } from "react";
import { CalendarClock, GitBranch, Link2, Pencil, Repeat, Tag, Trash2, Zap } from "lucide-react";
import { PillarBadges } from "@/components/shared";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IconButton,
} from "@/components/ui";
import { PRIORITY_LABEL } from "@/features/goals";
import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/validation/domain";
import { TASK_STATUS_LABEL, daysOverdue, isClosed, type Task, type TaskStatus } from "../schema";

const STATUS_VARIANT: Record<TaskStatus, "neutral" | "primary" | "warning" | "success" | "danger"> =
  {
    todo: "neutral",
    "in-progress": "primary",
    blocked: "warning",
    done: "success",
    cancelled: "danger",
  };

const PRIORITY_VARIANT: Record<Priority, "neutral" | "primary" | "warning" | "danger"> = {
  low: "neutral",
  medium: "primary",
  high: "warning",
  critical: "danger",
};

interface TaskCardProps {
  task: Task;
  today: string;
  goalTitleById: Map<string, string>;
  projectTitleById: Map<string, string>;
  milestoneTitleById: Map<string, string>;
  taskTitleById: Map<string, string>;
  subtasks?: { total: number; done: number };
  onEdit: (task: Task) => void;
  onArchive: (id: string) => Promise<void>;
  onToggleDone: (task: Task, done: boolean) => Promise<unknown>;
}

export function TaskCard({
  task,
  today,
  goalTitleById,
  projectTitleById,
  milestoneTitleById,
  taskTitleById,
  subtasks,
  onEdit,
  onArchive,
  onToggleDone,
}: TaskCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const overdueDays = daysOverdue(task, today);
  const closed = isClosed(task.taskStatus);

  const links: string[] = [
    task.goalId ? goalTitleById.get(task.goalId) : undefined,
    task.projectId ? projectTitleById.get(task.projectId) : undefined,
    task.milestoneId ? milestoneTitleById.get(task.milestoneId) : undefined,
  ].filter((value): value is string => Boolean(value));
  const parentTitle = task.parentTaskId ? taskTitleById.get(task.parentTaskId) : undefined;

  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start gap-2">
          <Checkbox
            className="mt-0.5"
            checked={task.taskStatus === "done"}
            aria-label={task.taskStatus === "done" ? "Mark as not done" : "Mark as done"}
            onCheckedChange={(checked) => onToggleDone(task, checked === true)}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={STATUS_VARIANT[task.taskStatus]}>
                {TASK_STATUS_LABEL[task.taskStatus]}
              </Badge>
              <Badge variant={PRIORITY_VARIANT[task.priority]}>
                {PRIORITY_LABEL[task.priority]}
              </Badge>
              {overdueDays > 0 ? <Badge variant="danger">{overdueDays}d overdue</Badge> : null}
              {task.recurrence ? (
                <Badge variant="outline" className="gap-1">
                  <Repeat className="size-3" aria-hidden="true" />
                  {task.recurrence.frequency}
                </Badge>
              ) : null}
            </div>
            <h3
              className={cn("mt-1 font-medium break-words", closed && "text-subtle line-through")}
            >
              {task.title}
            </h3>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <IconButton
              size="sm"
              aria-label="Edit task"
              icon={<Pencil />}
              onClick={() => onEdit(task)}
            />
            <IconButton
              size="sm"
              aria-label="Archive task"
              icon={<Trash2 />}
              onClick={() => setConfirmOpen(true)}
            />
          </div>
        </div>

        {task.description ? (
          <p className="text-muted text-sm break-words whitespace-pre-wrap">{task.description}</p>
        ) : null}

        <div className="text-subtle flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {task.dueDate ? (
            <span
              className={cn("inline-flex items-center gap-1", overdueDays > 0 && "text-danger")}
            >
              <CalendarClock className="size-3.5" aria-hidden="true" />
              due {task.dueDate}
            </span>
          ) : null}
          {task.estimatedMinutes > 0 || task.actualMinutes > 0 ? (
            <span>
              {task.actualMinutes}/{task.estimatedMinutes} min
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Zap className="size-3.5" aria-hidden="true" />
            {task.energyRequirement} energy
          </span>
          {task.context ? <span>{task.context}</span> : null}
          {subtasks && subtasks.total > 0 ? (
            <span className="inline-flex items-center gap-1">
              <GitBranch className="size-3.5" aria-hidden="true" />
              {subtasks.done}/{subtasks.total} subtasks
            </span>
          ) : null}
          {parentTitle ? (
            <span className="inline-flex items-center gap-1">
              <GitBranch className="size-3.5" aria-hidden="true" />
              under {parentTitle}
            </span>
          ) : null}
          {links.map((title) => (
            <span key={title} className="inline-flex items-center gap-1">
              <Link2 className="size-3.5" aria-hidden="true" />
              {title}
            </span>
          ))}
        </div>

        {task.tags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag className="text-subtle size-3.5" aria-hidden="true" />
            {task.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        {task.pillarIds.length > 0 ? <PillarBadges pillars={task.pillarIds} /> : null}

        {task.resolutionReason &&
        (task.taskStatus === "blocked" || task.taskStatus === "cancelled") ? (
          <p className="text-warning text-xs break-words whitespace-pre-wrap">
            {task.resolutionReason}
          </p>
        ) : null}
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this task?</DialogTitle>
            <DialogDescription>
              It is removed from your task list. This does not delete the record.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="danger"
              loading={archiving}
              onClick={async () => {
                setArchiving(true);
                try {
                  await onArchive(task.id);
                  setConfirmOpen(false);
                } finally {
                  setArchiving(false);
                }
              }}
            >
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
