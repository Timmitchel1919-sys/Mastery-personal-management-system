"use client";

import { useState } from "react";
import { AlertTriangle, CalendarClock, Link2, Pencil, Trash2, User } from "lucide-react";
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
import { PRIORITY_LABEL } from "@/features/goals";
import type { Priority } from "@/lib/validation/domain";
import { PROJECT_STATUS_LABEL, type Project, type ProjectStatus } from "../schema";

const STATUS_VARIANT: Record<
  ProjectStatus,
  "neutral" | "primary" | "warning" | "success" | "danger"
> = {
  planned: "neutral",
  active: "primary",
  blocked: "warning",
  complete: "success",
  cancelled: "danger",
};

const PRIORITY_VARIANT: Record<Priority, "neutral" | "info" | "warning" | "danger"> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
};

function dateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  return `${start ?? "—"} → ${end ?? "—"}`;
}

interface ProjectCardProps {
  project: Project;
  goalTitleById: Map<string, string>;
  onEdit: (project: Project) => void;
  onArchive: (id: string) => Promise<void>;
}

export function ProjectCard({ project, goalTitleById, onEdit, onArchive }: ProjectCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const range = dateRange(project.startDate, project.endDate);
  const goalTitle = project.goalId ? goalTitleById.get(project.goalId) : undefined;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={STATUS_VARIANT[project.projectStatus]}>
                {PROJECT_STATUS_LABEL[project.projectStatus]}
              </Badge>
              <Badge variant={PRIORITY_VARIANT[project.priority]}>
                {PRIORITY_LABEL[project.priority]}
              </Badge>
            </div>
            <h3 className="mt-1 font-medium break-words">{project.title}</h3>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <IconButton
              size="sm"
              aria-label="Edit project"
              icon={<Pencil />}
              onClick={() => onEdit(project)}
            />
            <IconButton
              size="sm"
              aria-label="Archive project"
              icon={<Trash2 />}
              onClick={() => setConfirmOpen(true)}
            />
          </div>
        </div>

        {project.expectedOutcome ? (
          <p className="text-muted text-sm break-words whitespace-pre-wrap">
            {project.expectedOutcome}
          </p>
        ) : null}

        <div className="space-y-1">
          <div className="text-subtle flex justify-between text-xs">
            <span>Progress</span>
            <span className="tabular-nums">{project.progress}%</span>
          </div>
          <Progress value={project.progress} label={`${project.title} progress`} />
        </div>

        <div className="text-subtle flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {project.owner ? (
            <span className="inline-flex items-center gap-1">
              <User className="size-3.5" aria-hidden="true" />
              {project.owner}
            </span>
          ) : null}
          {range ? (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3.5" aria-hidden="true" />
              {range}
            </span>
          ) : null}
          {goalTitle ? (
            <span className="inline-flex items-center gap-1">
              <Link2 className="size-3.5" aria-hidden="true" />
              {goalTitle}
            </span>
          ) : null}
          {project.risks.length > 0 ? (
            <span className="text-warning inline-flex items-center gap-1">
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              {project.risks.length} risk{project.risks.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>

        <PillarBadges pillars={project.pillarIds} />
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this project?</DialogTitle>
            <DialogDescription>
              It is removed from your projects list. This does not delete the record.
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
                  await onArchive(project.id);
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
