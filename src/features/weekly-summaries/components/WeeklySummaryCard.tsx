"use client";

import { useState } from "react";
import { Archive, Trash2 } from "lucide-react";
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
import { MetricCard } from "@/components/mastery";
import type { WeeklySummary } from "../schema";

interface WeeklySummaryCardProps {
  summary: WeeklySummary;
  onArchive: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function WeeklySummaryCard({ summary, onArchive, onDelete }: WeeklySummaryCardProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge variant="outline">
              {summary.weekStart} – {summary.weekEnd}
            </Badge>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <IconButton
              size="sm"
              aria-label="Archive summary"
              icon={<Archive />}
              loading={archiving}
              onClick={async () => {
                setArchiving(true);
                try {
                  await onArchive(summary.id);
                } finally {
                  setArchiving(false);
                }
              }}
            />
            <IconButton
              size="sm"
              aria-label="Delete summary"
              icon={<Trash2 />}
              onClick={() => setConfirmDeleteOpen(true)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard variant="plain" label="Tasks" value={`${summary.tasksCompleted} done`} />
          <MetricCard variant="plain" label="Overdue" value={String(summary.tasksStillOverdue)} />
          <MetricCard
            variant="plain"
            label="Habits"
            value={
              summary.habitConsistencyPercent === null ? "—" : `${summary.habitConsistencyPercent}%`
            }
          />
          <MetricCard variant="plain" label="Focus" value={`${summary.focusMinutes} min`} />
        </div>

        {summary.goalsCompleted.length > 0 || summary.milestonesCompleted.length > 0 ? (
          <p className="text-muted text-sm break-words">
            {[...summary.goalsCompleted, ...summary.milestonesCompleted].join(", ")}
          </p>
        ) : null}

        {summary.lessons.length > 0 ? (
          <div>
            <h4 className="text-subtle text-xs font-medium">Lessons</h4>
            <ul className="list-disc space-y-0.5 pl-5 text-sm">
              {summary.lessons.map((lesson, index) => (
                <li key={index} className="break-words">
                  {lesson}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {summary.suggestedPriorities.length > 0 ? (
          <div>
            <h4 className="text-subtle text-xs font-medium">Suggested priorities</h4>
            <ul className="list-disc space-y-0.5 pl-5 text-sm">
              {summary.suggestedPriorities.map((priority, index) => (
                <li key={index} className="break-words">
                  {priority}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this summary?</DialogTitle>
            <DialogDescription>
              This permanently removes it. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="danger"
              loading={deleting}
              onClick={async () => {
                setDeleting(true);
                try {
                  await onDelete(summary.id);
                  setConfirmDeleteOpen(false);
                } finally {
                  setDeleting(false);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
