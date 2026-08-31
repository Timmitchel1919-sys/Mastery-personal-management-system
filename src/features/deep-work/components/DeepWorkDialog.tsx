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
import { DeepWorkForm } from "./DeepWorkForm";
import type { DeepWorkFormValues, DeepWorkSession } from "../schema";

interface DeepWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: DeepWorkSession | null;
  goalOptions: GoalOption[];
  projectOptions: ProjectOption[];
  onSubmit: (values: DeepWorkFormValues) => Promise<void>;
}

export function DeepWorkDialog({
  open,
  onOpenChange,
  session,
  goalOptions,
  projectOptions,
  onSubmit,
}: DeepWorkDialogProps) {
  const editing = Boolean(session);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit deep work session" : "New deep work session"}</DialogTitle>
          <DialogDescription>
            Capture the intent, the timing, distractions, and how focused it felt.
          </DialogDescription>
        </DialogHeader>
        <DeepWorkForm
          key={session?.id ?? "new"}
          goalOptions={goalOptions}
          projectOptions={projectOptions}
          submitLabel={editing ? "Save changes" : "Log session"}
          defaultValues={
            session
              ? {
                  title: session.title,
                  intendedOutcome: session.intendedOutcome,
                  goalId: session.goalId ?? "",
                  projectId: session.projectId ?? "",
                  plannedMinutes: session.plannedMinutes,
                  startedAt: session.startedAt ?? "",
                  endedAt: session.endedAt ?? "",
                  actualMinutes: session.actualMinutes,
                  energyLevel: session.energyLevel,
                  focusQuality: session.focusQuality,
                  distractions: session.distractions,
                  completionNotes: session.completionNotes,
                  sessionStatus: session.sessionStatus,
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
