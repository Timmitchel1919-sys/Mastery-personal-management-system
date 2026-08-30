"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { GoalOption } from "@/features/goals";
import { ProjectForm } from "./ProjectForm";
import type { Project, ProjectFormValues } from "../schema";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  goalOptions: GoalOption[];
  onSubmit: (values: ProjectFormValues) => Promise<void>;
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  goalOptions,
  onSubmit,
}: ProjectDialogProps) {
  const editing = Boolean(project);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            Projects deliver a goal through milestones, tasks, and managed risk.
          </DialogDescription>
        </DialogHeader>
        <ProjectForm
          key={project?.id ?? "new"}
          goalOptions={goalOptions}
          submitLabel={editing ? "Save changes" : "Create project"}
          defaultValues={
            project
              ? {
                  title: project.title,
                  description: project.description,
                  expectedOutcome: project.expectedOutcome,
                  pillarIds: project.pillarIds,
                  goalId: project.goalId ?? "",
                  owner: project.owner,
                  startDate: project.startDate ?? "",
                  endDate: project.endDate ?? "",
                  projectStatus: project.projectStatus,
                  priority: project.priority,
                  progress: project.progress,
                  dependencies: project.dependencies,
                  risks: project.risks,
                  reviewNotes: project.reviewNotes,
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
