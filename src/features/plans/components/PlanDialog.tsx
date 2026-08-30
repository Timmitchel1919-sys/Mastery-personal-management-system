"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { PlanForm } from "./PlanForm";
import { PLAN_HORIZON_META, type Plan, type PlanFormValues, type PlanHorizon } from "../schema";

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  horizon: PlanHorizon;
  plan?: Plan | null;
  onSubmit: (values: PlanFormValues) => Promise<void>;
}

export function PlanDialog({ open, onOpenChange, horizon, plan, onSubmit }: PlanDialogProps) {
  const editing = Boolean(plan);
  const meta = PLAN_HORIZON_META[horizon];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit plan" : `New ${meta.label.replace(/s$/, "").toLowerCase()}`}
          </DialogTitle>
          <DialogDescription>{meta.description}</DialogDescription>
        </DialogHeader>
        <PlanForm
          key={plan?.id ?? "new"}
          horizon={horizon}
          submitLabel={editing ? "Save changes" : "Create plan"}
          defaultValues={
            plan
              ? {
                  title: plan.title,
                  objective: plan.objective,
                  desiredOutcomes: plan.desiredOutcomes,
                  keyMeasures: plan.keyMeasures,
                  startDate: plan.startDate ?? "",
                  endDate: plan.endDate ?? "",
                  planStatus: plan.planStatus,
                  progress: plan.progress,
                  reviewNotes: plan.reviewNotes,
                  pillarIds: plan.pillarIds,
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
