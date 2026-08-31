"use client";

import { useState } from "react";
import { CalendarRange, Link2, Pencil, Route, Trash2 } from "lucide-react";
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
  PHASE_STATUS_LABEL,
  ROADMAP_KIND_LABEL,
  ROADMAP_STATUS_LABEL,
  type Roadmap,
  type PhaseStatus,
  type RoadmapStatus,
} from "../schema";

const STATUS_VARIANT: Record<RoadmapStatus, "neutral" | "primary" | "warning" | "success"> = {
  planning: "neutral",
  active: "primary",
  "on-hold": "warning",
  complete: "success",
};

const PHASE_DOT: Record<PhaseStatus, string> = {
  upcoming: "bg-surface",
  "in-progress": "bg-primary",
  done: "bg-success",
};

function dateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  return `${start ?? "—"} → ${end ?? "—"}`;
}

interface RoadmapCardProps {
  roadmap: Roadmap;
  goalTitleById: Map<string, string>;
  projectTitleById: Map<string, string>;
  onEdit: (roadmap: Roadmap) => void;
  onArchive: (id: string) => Promise<void>;
}

export function RoadmapCard({
  roadmap,
  goalTitleById,
  projectTitleById,
  onEdit,
  onArchive,
}: RoadmapCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const range = dateRange(roadmap.startDate, roadmap.endDate);
  const goalTitle = roadmap.linkedGoalId ? goalTitleById.get(roadmap.linkedGoalId) : undefined;
  const projectTitle = roadmap.linkedProjectId
    ? projectTitleById.get(roadmap.linkedProjectId)
    : undefined;
  const doneCount = roadmap.phases.filter((phase) => phase.phaseStatus === "done").length;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={STATUS_VARIANT[roadmap.roadmapStatus]}>
                {ROADMAP_STATUS_LABEL[roadmap.roadmapStatus]}
              </Badge>
              <Badge variant="outline">{ROADMAP_KIND_LABEL[roadmap.roadmapKind]}</Badge>
            </div>
            <h3 className="mt-1 font-medium break-words">{roadmap.title}</h3>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <IconButton
              size="sm"
              aria-label="Edit roadmap"
              icon={<Pencil />}
              onClick={() => onEdit(roadmap)}
            />
            <IconButton
              size="sm"
              aria-label="Archive roadmap"
              icon={<Trash2 />}
              onClick={() => setConfirmOpen(true)}
            />
          </div>
        </div>

        {roadmap.description ? (
          <p className="text-muted text-sm break-words whitespace-pre-wrap">
            {roadmap.description}
          </p>
        ) : null}

        <div className="space-y-1">
          <div className="text-subtle flex justify-between text-xs">
            <span>Progress</span>
            <span className="tabular-nums">{roadmap.progress}%</span>
          </div>
          <Progress value={roadmap.progress} label={`${roadmap.title} progress`} />
        </div>

        {roadmap.phases.length > 0 ? (
          <ol className="space-y-1">
            {roadmap.phases.map((phase) => (
              <li
                key={`${phase.name}:${phase.phaseStatus}:${phase.startDate ?? ""}:${phase.endDate ?? ""}`}
                className="text-subtle flex items-center gap-2 text-xs"
              >
                <span
                  className={`border-border size-2 shrink-0 rounded-full border ${PHASE_DOT[phase.phaseStatus]}`}
                  aria-hidden="true"
                />
                <span className="text-foreground truncate">{phase.name}</span>
                <span className="ml-auto shrink-0">{PHASE_STATUS_LABEL[phase.phaseStatus]}</span>
              </li>
            ))}
          </ol>
        ) : null}

        <div className="text-subtle flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1">
            <Route className="size-3.5" aria-hidden="true" />
            {doneCount}/{roadmap.phases.length} phase
            {roadmap.phases.length === 1 ? "" : "s"} done
          </span>
          {range ? (
            <span className="inline-flex items-center gap-1">
              <CalendarRange className="size-3.5" aria-hidden="true" />
              {range}
            </span>
          ) : null}
          {goalTitle ? (
            <span className="inline-flex items-center gap-1">
              <Link2 className="size-3.5" aria-hidden="true" />
              {goalTitle}
            </span>
          ) : null}
          {projectTitle ? (
            <span className="inline-flex items-center gap-1">
              <Link2 className="size-3.5" aria-hidden="true" />
              {projectTitle}
            </span>
          ) : null}
        </div>

        <PillarBadges pillars={roadmap.pillarIds} />
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this roadmap?</DialogTitle>
            <DialogDescription>
              It is removed from your roadmaps list. This does not delete the record.
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
                  await onArchive(roadmap.id);
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
