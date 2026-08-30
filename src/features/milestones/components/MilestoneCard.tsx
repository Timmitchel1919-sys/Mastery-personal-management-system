"use client";

import { useState } from "react";
import { CalendarClock, GitBranch, Link2, Pencil, Trash2 } from "lucide-react";
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
import {
  MILESTONE_PARENT_TYPE_LABEL,
  MILESTONE_STATUS_LABEL,
  type Milestone,
  type MilestoneStatus,
} from "../schema";

const STATUS_VARIANT: Record<MilestoneStatus, "neutral" | "primary" | "success" | "danger"> = {
  upcoming: "neutral",
  "in-progress": "primary",
  done: "success",
  missed: "danger",
};

interface MilestoneCardProps {
  milestone: Milestone;
  parentTitleById: Map<string, string>;
  onEdit: (milestone: Milestone) => void;
  onArchive: (id: string) => Promise<void>;
}

export function MilestoneCard({
  milestone,
  parentTitleById,
  onEdit,
  onArchive,
}: MilestoneCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const parentTitle =
    milestone.parentType !== "none" && milestone.parentId
      ? parentTitleById.get(milestone.parentId)
      : undefined;
  const parentLabel = parentTitle
    ? `${MILESTONE_PARENT_TYPE_LABEL[milestone.parentType]}: ${parentTitle}`
    : undefined;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Badge variant={STATUS_VARIANT[milestone.milestoneStatus]}>
              {MILESTONE_STATUS_LABEL[milestone.milestoneStatus]}
            </Badge>
            <h3 className="mt-1 font-medium break-words">{milestone.title}</h3>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <IconButton
              size="sm"
              aria-label="Edit milestone"
              icon={<Pencil />}
              onClick={() => onEdit(milestone)}
            />
            <IconButton
              size="sm"
              aria-label="Archive milestone"
              icon={<Trash2 />}
              onClick={() => setConfirmOpen(true)}
            />
          </div>
        </div>

        {milestone.description ? (
          <p className="text-muted text-sm break-words whitespace-pre-wrap">
            {milestone.description}
          </p>
        ) : null}

        <div className="space-y-1">
          <div className="text-subtle flex justify-between text-xs">
            <span>Progress</span>
            <span className="tabular-nums">{milestone.progress}%</span>
          </div>
          <Progress value={milestone.progress} label={`${milestone.title} progress`} />
        </div>

        <div className="text-subtle flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {milestone.dueDate ? (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3.5" aria-hidden="true" />
              {milestone.dueDate}
            </span>
          ) : null}
          {parentLabel ? (
            <span className="inline-flex items-center gap-1">
              <Link2 className="size-3.5" aria-hidden="true" />
              {parentLabel}
            </span>
          ) : null}
          {milestone.dependencies.length > 0 ? (
            <span className="inline-flex items-center gap-1">
              <GitBranch className="size-3.5" aria-hidden="true" />
              {milestone.dependencies.length} dependenc
              {milestone.dependencies.length === 1 ? "y" : "ies"}
            </span>
          ) : null}
        </div>

        <PillarBadges pillars={milestone.pillarIds} />
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this milestone?</DialogTitle>
            <DialogDescription>
              It is removed from your milestones list. This does not delete the record.
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
                  await onArchive(milestone.id);
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
