"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { GoalOption } from "@/features/goals";
import { SkillForm } from "./SkillForm";
import type { Skill, SkillFormValues } from "../schema";

interface SkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill?: Skill | null;
  goalOptions: GoalOption[];
  onSubmit: (values: SkillFormValues) => Promise<void>;
}

export function SkillDialog({
  open,
  onOpenChange,
  skill,
  goalOptions,
  onSubmit,
}: SkillDialogProps) {
  const editing = Boolean(skill);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit skill" : "New skill"}</DialogTitle>
          <DialogDescription>
            Set a target and a practice plan — log a review whenever you reassess it.
          </DialogDescription>
        </DialogHeader>
        <SkillForm
          key={skill?.id ?? "new"}
          goalOptions={goalOptions}
          submitLabel={editing ? "Save changes" : "Add skill"}
          defaultValues={
            skill
              ? {
                  title: skill.title,
                  description: skill.description,
                  category: skill.category,
                  startingProficiency: skill.startingProficiency,
                  targetProficiency: skill.targetProficiency,
                  practicePlan: skill.practicePlan,
                  evidenceText: skill.evidence.join("\n"),
                  resourcesText: skill.resources.join("\n"),
                  goalId: skill.goalId ?? "",
                  pillarIds: skill.pillarIds,
                  nextReviewDate: skill.nextReviewDate ?? "",
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
