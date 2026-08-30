"use client";

import { useState } from "react";
import { CalendarClock, Link2, Pencil, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IconButton,
  Progress,
} from "@/components/ui";
import { PillarBadges } from "@/components/shared";
import { GOAL_STATUS_LABEL, PRIORITY_LABEL, type Goal, type GoalStatus } from "../schema";
import type { Priority } from "@/lib/validation/domain";

const STATUS_VARIANT: Record<GoalStatus, "neutral" | "primary" | "warning" | "success" | "danger"> =
  {
    "not-started": "neutral",
    "in-progress": "primary",
    "on-hold": "warning",
    achieved: "success",
    dropped: "danger",
  };

const PRIORITY_VARIANT: Record<Priority, "neutral" | "info" | "warning" | "danger"> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
};

function measureSummary(goal: Goal): string | null {
  if (goal.currentValue == null && goal.targetValue == null) return null;
  const current = goal.currentValue ?? "—";
  const target = goal.targetValue ?? "—";
  return `${current} / ${target}${goal.unit ? ` ${goal.unit}` : ""}`;
}

interface GoalCardProps {
  goal: Goal;
  planTitleById: Map<string, string>;
  onEdit: (goal: Goal) => void;
  onArchive: (id: string) => Promise<void>;
}

export function GoalCard({ goal, planTitleById, onEdit, onArchive }: GoalCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const measure = measureSummary(goal);
  const parentTitle = goal.parentPlanId ? planTitleById.get(goal.parentPlanId) : undefined;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={STATUS_VARIANT[goal.goalStatus]}>
                {GOAL_STATUS_LABEL[goal.goalStatus]}
              </Badge>
              <Badge variant={PRIORITY_VARIANT[goal.priority]}>
                {PRIORITY_LABEL[goal.priority]}
              </Badge>
            </div>
            <h3 className="mt-1 font-medium break-words">{goal.title}</h3>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <IconButton
              size="sm"
              aria-label="Edit goal"
              icon={<Pencil />}
              onClick={() => onEdit(goal)}
            />
            <IconButton
              size="sm"
              aria-label="Archive goal"
              icon={<Trash2 />}
              onClick={() => setConfirmOpen(true)}
            />
          </div>
        </div>

        {goal.description ? (
          <p className="text-muted text-sm break-words whitespace-pre-wrap">{goal.description}</p>
        ) : null}

        <div className="space-y-1">
          <div className="text-subtle flex justify-between text-xs">
            <span>Progress</span>
            <span className="tabular-nums">{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} label={`${goal.title} progress`} />
        </div>

        <div className="text-subtle flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {measure ? <span>{measure}</span> : null}
          {goal.targetDate ? (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3.5" aria-hidden="true" />
              {goal.targetDate}
            </span>
          ) : null}
          {parentTitle ? (
            <span className="inline-flex items-center gap-1">
              <Link2 className="size-3.5" aria-hidden="true" />
              {parentTitle}
            </span>
          ) : null}
        </div>

        <PillarBadges pillars={goal.pillarIds} />
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this goal?</DialogTitle>
            <DialogDescription>
              It is removed from your goals list. This does not delete the record.
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
                  await onArchive(goal.id);
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
