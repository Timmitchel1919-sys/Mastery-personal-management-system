"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { GoalOption } from "@/features/goals";
import type { ProjectOption } from "@/features/projects";
import { RoadmapForm } from "./RoadmapForm";
import type { Roadmap, RoadmapFormValues } from "../schema";

interface RoadmapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roadmap?: Roadmap | null;
  goalOptions: GoalOption[];
  projectOptions: ProjectOption[];
  onSubmit: (values: RoadmapFormValues) => Promise<void>;
}

export function RoadmapDialog({
  open,
  onOpenChange,
  roadmap,
  goalOptions,
  projectOptions,
  onSubmit,
}: RoadmapDialogProps) {
  const editing = Boolean(roadmap);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit roadmap" : "New roadmap"}</DialogTitle>
          <DialogDescription>
            A roadmap lays out a timeline of phases toward a goal, project, or program.
          </DialogDescription>
        </DialogHeader>
        <RoadmapForm
          key={roadmap?.id ?? "new"}
          goalOptions={goalOptions}
          projectOptions={projectOptions}
          submitLabel={editing ? "Save changes" : "Create roadmap"}
          defaultValues={
            roadmap
              ? {
                  title: roadmap.title,
                  description: roadmap.description,
                  pillarIds: roadmap.pillarIds,
                  roadmapKind: roadmap.roadmapKind,
                  linkedGoalId: roadmap.linkedGoalId ?? "",
                  linkedProjectId: roadmap.linkedProjectId ?? "",
                  startDate: roadmap.startDate ?? "",
                  endDate: roadmap.endDate ?? "",
                  roadmapStatus: roadmap.roadmapStatus,
                  progress: roadmap.progress,
                  phases: roadmap.phases.map((phase) => ({
                    name: phase.name,
                    startDate: phase.startDate ?? "",
                    endDate: phase.endDate ?? "",
                    phaseStatus: phase.phaseStatus,
                  })),
                  notes: roadmap.notes,
                }
              : undefined
          }
          onSubmit={async (values) => {
            await onSubmit(values);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
