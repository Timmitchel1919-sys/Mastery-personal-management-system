"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
import { PLAN_STATUS_LABEL, type Plan, type PlanStatus } from "../schema";

const STATUS_VARIANT: Record<PlanStatus, "neutral" | "primary" | "success" | "warning"> = {
  planned: "neutral",
  active: "primary",
  complete: "success",
  abandoned: "warning",
};

function dateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  return `${start ?? "—"} → ${end ?? "—"}`;
}

interface PlanCardProps {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onArchive: (id: string) => Promise<void>;
}

export function PlanCard({ plan, onEdit, onArchive }: PlanCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const range = dateRange(plan.startDate, plan.endDate);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_VARIANT[plan.planStatus]}>
                {PLAN_STATUS_LABEL[plan.planStatus]}
              </Badge>
              {range ? <span className="text-subtle text-xs">{range}</span> : null}
            </div>
            <h3 className="mt-1 font-medium break-words">{plan.title}</h3>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <IconButton
              size="sm"
              aria-label="Edit plan"
              icon={<Pencil />}
              onClick={() => onEdit(plan)}
            />
            <IconButton
              size="sm"
              aria-label="Archive plan"
              icon={<Trash2 />}
              onClick={() => setConfirmOpen(true)}
            />
          </div>
        </div>

        <p className="text-muted text-sm break-words whitespace-pre-wrap">{plan.objective}</p>

        <div className="space-y-1">
          <div className="text-subtle flex justify-between text-xs">
            <span>Progress</span>
            <span className="tabular-nums">{plan.progress}%</span>
          </div>
          <Progress value={plan.progress} label={`${plan.title} progress`} />
        </div>

        {plan.desiredOutcomes.length > 0 ? (
          <ul className="text-muted list-disc space-y-0.5 pl-5 text-sm">
            {plan.desiredOutcomes.slice(0, 3).map((outcome, index) => (
              <li key={index}>{outcome}</li>
            ))}
            {plan.desiredOutcomes.length > 3 ? (
              <li className="text-subtle list-none">+{plan.desiredOutcomes.length - 3} more</li>
            ) : null}
          </ul>
        ) : null}

        <PillarBadges pillars={plan.pillarIds} />
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this plan?</DialogTitle>
            <DialogDescription>
              It is removed from this tier. This does not delete the record.
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
                  await onArchive(plan.id);
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
