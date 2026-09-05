"use client";

import { useState } from "react";
import { Pencil, Sparkles, Trash2 } from "lucide-react";
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
import { RECOVERY_GOAL_STATUS_LABEL, type RecoveryGoal } from "../recovery-goal-schema";

const STATUS_VARIANT: Record<
  RecoveryGoal["recoveryStatus"],
  "neutral" | "primary" | "success" | "warning"
> = {
  active: "primary",
  "going-well": "success",
  challenging: "warning",
  paused: "neutral",
};

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-subtle text-xs font-medium">{title}</h4>
      <ul className="list-disc space-y-0.5 pl-5 text-sm">
        {items.map((item, index) => (
          <li key={index} className="break-words">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface RecoveryGoalCardProps {
  goal: RecoveryGoal;
  onOpen: (goal: RecoveryGoal) => void;
  onEdit: (goal: RecoveryGoal) => void;
  onArchive: (id: string) => Promise<void>;
}

export function RecoveryGoalCard({ goal, onOpen, onEdit, onArchive }: RecoveryGoalCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={STATUS_VARIANT[goal.recoveryStatus]}>
                {RECOVERY_GOAL_STATUS_LABEL[goal.recoveryStatus]}
              </Badge>
              {goal.faithBasedEncouragement ? (
                <Badge variant="outline">
                  <Sparkles className="size-3" aria-hidden="true" />
                  Faith-based
                </Badge>
              ) : null}
              {goal.startDate ? (
                <span className="text-subtle text-xs">since {goal.startDate}</span>
              ) : null}
            </div>
            <h3 className="mt-1 font-medium break-words">{goal.behavior}</h3>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <Button variant="ghost" size="sm" onClick={() => onOpen(goal)}>
              Open
            </Button>
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
        {goal.motivation ? (
          <p className="text-subtle text-sm break-words whitespace-pre-wrap italic">
            {goal.motivation}
          </p>
        ) : null}

        <ListBlock title="Triggers" items={goal.triggers} />
        <ListBlock title="Early warning signs" items={goal.warningSigns} />
        <ListBlock title="Coping strategies" items={goal.copingStrategies} />

        {goal.supportNotes ? (
          <p className="text-subtle text-xs break-words whitespace-pre-wrap">{goal.supportNotes}</p>
        ) : null}
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this goal?</DialogTitle>
            <DialogDescription>
              It moves out of your active list. Nothing is deleted — you can restore it later.
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
