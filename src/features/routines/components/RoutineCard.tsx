"use client";

import { useState } from "react";
import { Clock, Copy, Link2, Pencil, Trash2 } from "lucide-react";
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
  Progress,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { computeRoutineProgress } from "../routine-progress";
import { ROUTINE_TYPE_LABEL, type Routine, type RoutineLog } from "../schema";

interface RoutineCardProps {
  routine: Routine;
  todayLog: RoutineLog | undefined;
  habitTitleById: Map<string, string>;
  onEdit: (routine: Routine) => void;
  onArchive: (id: string) => Promise<void>;
  onToggleStep: (routineId: string, stepId: string) => Promise<unknown>;
  onDuplicate: (routine: Routine) => Promise<unknown>;
}

export function RoutineCard({
  routine,
  todayLog,
  habitTitleById,
  onEdit,
  onArchive,
  onToggleStep,
  onDuplicate,
}: RoutineCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const progress = computeRoutineProgress(routine, todayLog);
  const completedIds = new Set(todayLog?.completedStepIds ?? []);
  const percent =
    progress.totalSteps === 0 ? 0 : (progress.completedSteps / progress.totalSteps) * 100;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="primary">{ROUTINE_TYPE_LABEL[routine.routineType]}</Badge>
              {routine.isTemplate ? <Badge variant="outline">Template</Badge> : null}
              {!routine.isTemplate && progress.totalSteps > 0 ? (
                <Badge
                  variant={progress.completedSteps === progress.totalSteps ? "success" : "neutral"}
                >
                  {progress.completedSteps}/{progress.totalSteps} today
                </Badge>
              ) : null}
            </div>
            <h3 className="mt-1 font-medium break-words">{routine.title}</h3>
          </div>
          <div className="flex shrink-0 gap-0.5">
            {routine.isTemplate ? (
              <IconButton
                size="sm"
                aria-label="Use this template"
                icon={<Copy />}
                onClick={() => onDuplicate(routine)}
              />
            ) : null}
            <IconButton
              size="sm"
              aria-label="Edit routine"
              icon={<Pencil />}
              onClick={() => onEdit(routine)}
            />
            <IconButton
              size="sm"
              aria-label="Archive routine"
              icon={<Trash2 />}
              onClick={() => setConfirmOpen(true)}
            />
          </div>
        </div>

        {routine.description ? (
          <p className="text-muted text-sm break-words whitespace-pre-wrap">
            {routine.description}
          </p>
        ) : null}

        {!routine.isTemplate && progress.totalSteps > 0 ? <Progress value={percent} /> : null}

        {progress.totalMinutes > 0 ? (
          <span className="text-subtle inline-flex items-center gap-1 text-xs">
            <Clock className="size-3.5" aria-hidden="true" />
            {progress.totalMinutes} min planned
          </span>
        ) : null}

        <ul className="space-y-1.5">
          {routine.steps.map((step) => {
            const done = completedIds.has(step.id);
            const habitTitle = step.habitId ? habitTitleById.get(step.habitId) : undefined;
            return (
              <li key={step.id} className="flex items-center gap-2 text-sm">
                {routine.isTemplate ? (
                  <span className="text-subtle size-4 shrink-0 text-center text-xs">·</span>
                ) : (
                  <Checkbox
                    checked={done}
                    aria-label={`${step.title}${done ? " (done)" : ""}`}
                    onCheckedChange={() => onToggleStep(routine.id, step.id)}
                  />
                )}
                <span
                  className={cn("min-w-0 flex-1 break-words", done && "text-subtle line-through")}
                >
                  {step.title}
                </span>
                {step.estimatedMinutes > 0 ? (
                  <span className="text-subtle shrink-0 text-xs">{step.estimatedMinutes}m</span>
                ) : null}
                {habitTitle ? (
                  <span className="text-subtle inline-flex shrink-0 items-center gap-1 text-xs">
                    <Link2 className="size-3" aria-hidden="true" />
                    {habitTitle}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>

        {routine.pillarIds.length > 0 ? <PillarBadges pillars={routine.pillarIds} /> : null}
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this routine?</DialogTitle>
            <DialogDescription>
              It is removed from your routine list. This does not delete its logs.
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
                  await onArchive(routine.id);
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
