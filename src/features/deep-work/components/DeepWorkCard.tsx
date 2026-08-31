"use client";

import { useState } from "react";
import { Activity, BatteryMedium, CalendarClock, Link2, Pencil, Trash2, Zap } from "lucide-react";
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
import { computeSessionScore } from "../deep-work-score";
import { DEEP_WORK_STATUS_LABEL, type DeepWorkSession, type DeepWorkStatus } from "../schema";

const STATUS_VARIANT: Record<DeepWorkStatus, "neutral" | "primary" | "success" | "danger"> = {
  planned: "neutral",
  "in-progress": "primary",
  completed: "success",
  abandoned: "danger",
};

function formatWhen(iso: string | null): string | null {
  if (!iso) return null;
  return iso.slice(0, 16).replace("T", " ");
}

interface DeepWorkCardProps {
  session: DeepWorkSession;
  goalTitleById: Map<string, string>;
  projectTitleById: Map<string, string>;
  onEdit: (session: DeepWorkSession) => void;
  onArchive: (id: string) => Promise<void>;
}

export function DeepWorkCard({
  session,
  goalTitleById,
  projectTitleById,
  onEdit,
  onArchive,
}: DeepWorkCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const score = computeSessionScore(session);
  const started = formatWhen(session.startedAt);
  const link =
    (session.goalId ? goalTitleById.get(session.goalId) : undefined) ??
    (session.projectId ? projectTitleById.get(session.projectId) : undefined);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={STATUS_VARIANT[session.sessionStatus]}>
                {DEEP_WORK_STATUS_LABEL[session.sessionStatus]}
              </Badge>
              {score !== null ? <Badge variant="outline">Score {score}</Badge> : null}
            </div>
            <h3 className="mt-1 font-medium break-words">{session.title}</h3>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <IconButton
              size="sm"
              aria-label="Edit session"
              icon={<Pencil />}
              onClick={() => onEdit(session)}
            />
            <IconButton
              size="sm"
              aria-label="Archive session"
              icon={<Trash2 />}
              onClick={() => setConfirmOpen(true)}
            />
          </div>
        </div>

        {session.intendedOutcome ? (
          <p className="text-muted text-sm break-words whitespace-pre-wrap">
            {session.intendedOutcome}
          </p>
        ) : null}

        <div className="text-subtle flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1">
            <Activity className="size-3.5" aria-hidden="true" />
            {session.actualMinutes}/{session.plannedMinutes} min
          </span>
          <span className="inline-flex items-center gap-1">
            <BatteryMedium className="size-3.5" aria-hidden="true" />
            energy {session.energyLevel}/5
          </span>
          <span className="inline-flex items-center gap-1">
            <Zap className="size-3.5" aria-hidden="true" />
            focus {session.focusQuality}/5
          </span>
          {session.distractions.length > 0 ? (
            <span className="text-warning">
              {session.distractions.length} distraction
              {session.distractions.length === 1 ? "" : "s"}
            </span>
          ) : null}
          {link ? (
            <span className="inline-flex items-center gap-1">
              <Link2 className="size-3.5" aria-hidden="true" />
              {link}
            </span>
          ) : null}
          {started ? (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3.5" aria-hidden="true" />
              {started}
            </span>
          ) : null}
        </div>

        {session.completionNotes ? (
          <p className="text-subtle text-xs break-words whitespace-pre-wrap">
            {session.completionNotes}
          </p>
        ) : null}
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this session?</DialogTitle>
            <DialogDescription>
              It is removed from your deep work log. This does not delete the record.
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
                  await onArchive(session.id);
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
