"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { GoalOption } from "@/features/goals";
import { KpiForm } from "./KpiForm";
import type { Kpi, KpiFormValues } from "../schema";

interface KpiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi?: Kpi | null;
  goalOptions: GoalOption[];
  onSubmit: (values: KpiFormValues) => Promise<void>;
}

export function KpiDialog({ open, onOpenChange, kpi, goalOptions, onSubmit }: KpiDialogProps) {
  const editing = Boolean(kpi);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit KPI" : "New KPI"}</DialogTitle>
          <DialogDescription>
            Set a target and direction — log entries to build its history and Life Score
            contribution.
          </DialogDescription>
        </DialogHeader>
        <KpiForm
          key={kpi?.id ?? "new"}
          goalOptions={goalOptions}
          submitLabel={editing ? "Save changes" : "Add KPI"}
          defaultValues={
            kpi
              ? {
                  title: kpi.title,
                  description: kpi.description,
                  category: kpi.category,
                  pillarIds: kpi.pillarIds,
                  unit: kpi.unit,
                  direction: kpi.direction,
                  targetValue: kpi.targetValue,
                  weight: kpi.weight,
                  goalId: kpi.goalId ?? "",
                  notes: kpi.notes,
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
