"use client";

import { useState } from "react";
import { AlertTriangle, CalendarClock, Clock, Link2, Pencil, Trash2 } from "lucide-react";
import { PillarBadges } from "@/components/shared";
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
} from "@/components/ui";
import { isoToWall } from "@/features/calendar";
import {
  TIME_BLOCK_CATEGORY_LABEL,
  TIME_BLOCK_STATUS_LABEL,
  blockDurationMinutes,
  type TimeBlock,
  type TimeBlockStatus,
} from "../schema";

const STATUS_VARIANT: Record<TimeBlockStatus, "neutral" | "success" | "warning"> = {
  planned: "neutral",
  done: "success",
  skipped: "warning",
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

function formatRange(block: TimeBlock): string {
  const start = isoToWall(block.startDateTime, block.timeZone);
  const end = isoToWall(block.endDateTime, block.timeZone);
  const endLabel = end.date === start.date ? end.time : `${end.date} ${end.time}`;
  return `${start.date} ${start.time} – ${endLabel}`;
}

interface TimeBlockCardProps {
  block: TimeBlock;
  conflict: boolean;
  goalTitleById: Map<string, string>;
  projectTitleById: Map<string, string>;
  onEdit: (block: TimeBlock) => void;
  onArchive: (id: string) => Promise<void>;
}

export function TimeBlockCard({
  block,
  conflict,
  goalTitleById,
  projectTitleById,
  onEdit,
  onArchive,
}: TimeBlockCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const link =
    (block.goalId ? goalTitleById.get(block.goalId) : undefined) ??
    (block.projectId ? projectTitleById.get(block.projectId) : undefined);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="primary">{TIME_BLOCK_CATEGORY_LABEL[block.category]}</Badge>
              <Badge variant={STATUS_VARIANT[block.blockStatus]}>
                {TIME_BLOCK_STATUS_LABEL[block.blockStatus]}
              </Badge>
              {conflict ? (
                <Badge variant="danger" className="gap-1">
                  <AlertTriangle className="size-3.5" aria-hidden="true" />
                  Overlap
                </Badge>
              ) : null}
            </div>
            <h3 className="mt-1 font-medium break-words">{block.title}</h3>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <IconButton
              size="sm"
              aria-label="Edit block"
              icon={<Pencil />}
              onClick={() => onEdit(block)}
            />
            <IconButton
              size="sm"
              aria-label="Archive block"
              icon={<Trash2 />}
              onClick={() => setConfirmOpen(true)}
            />
          </div>
        </div>

        <div className="text-subtle flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="size-3.5" aria-hidden="true" />
            {formatRange(block)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {formatDuration(blockDurationMinutes(block))}
          </span>
          <span>{block.timeZone}</span>
          {link ? (
            <span className="inline-flex items-center gap-1">
              <Link2 className="size-3.5" aria-hidden="true" />
              {link}
            </span>
          ) : null}
        </div>

        {block.pillarIds.length > 0 ? <PillarBadges pillars={block.pillarIds} /> : null}

        {block.notes ? (
          <p className="text-subtle text-xs break-words whitespace-pre-wrap">{block.notes}</p>
        ) : null}
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this block?</DialogTitle>
            <DialogDescription>
              It is removed from your schedule. This does not delete the record.
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
                  await onArchive(block.id);
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
