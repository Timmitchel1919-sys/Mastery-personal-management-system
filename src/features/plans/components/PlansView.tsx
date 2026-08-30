"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button, Skeleton } from "@/components/ui";
import { usePlans } from "../use-plans";
import {
  PLAN_HORIZON_META,
  PLAN_STATUSES,
  planInputFromForm,
  type Plan,
  type PlanHorizon,
} from "../schema";
import { PlanCard } from "./PlanCard";
import { PlanDialog } from "./PlanDialog";

const STATUS_ORDER = new Map(PLAN_STATUSES.map((status, index) => [status, index]));

export function PlansView({ horizon }: { horizon: PlanHorizon }) {
  const meta = PLAN_HORIZON_META[horizon];
  const { status, items, error, reload, create, update, archive } = usePlans(horizon);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        const byStatus =
          (STATUS_ORDER.get(a.planStatus) ?? 0) - (STATUS_ORDER.get(b.planStatus) ?? 0);
        if (byStatus !== 0) return byStatus;
        return (
          (a.startDate ?? "").localeCompare(b.startDate ?? "") ||
          a.createdAt.localeCompare(b.createdAt)
        );
      }),
    [items],
  );

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(plan: Plan) {
    setEditing(plan);
    setDialogOpen(true);
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title={meta.label}
        description={meta.description}
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button onClick={openCreate} disabled={status === "loading"}>
            <Plus />
            New plan
          </Button>
        }
      />

      {status === "loading" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-52" />
          ))}
        </div>
      ) : status === "error" ? (
        <ErrorState
          className="min-h-[40vh]"
          title={`We couldn't load your ${meta.label.toLowerCase()}`}
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          title={`No ${meta.label.toLowerCase()} yet`}
          description="Add a plan with an objective, outcomes, and the measures you'll track."
          action={
            <Button onClick={openCreate}>
              <Plus />
              Add your first plan
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onEdit={openEdit} onArchive={archive} />
          ))}
        </div>
      )}

      <PlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        horizon={horizon}
        plan={editing}
        onSubmit={async (values) => {
          const input = planInputFromForm(values, editing?.parentId ?? null);
          if (editing) await update(editing.id, input);
          else await create(input);
        }}
      />
    </PageContainer>
  );
}
