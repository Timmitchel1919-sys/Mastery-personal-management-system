"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button, Skeleton } from "@/components/ui";
import { usePlanOptions } from "@/features/plans";
import { PRIORITIES } from "@/lib/validation/domain";
import { useGoals } from "../use-goals";
import { GOAL_STATUSES, goalInputFromForm, type Goal } from "../schema";
import { GoalCard } from "./GoalCard";
import { GoalDialog } from "./GoalDialog";

const PRIORITY_RANK = new Map(
  PRIORITIES.map((priority, index) => [priority, PRIORITIES.length - index]),
);
const STATUS_RANK = new Map(GOAL_STATUSES.map((status, index) => [status, index]));

export function GoalsView() {
  const { status, items, error, reload, create, update, archive } = useGoals();
  const { options: planOptions } = usePlanOptions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const planTitleById = useMemo(
    () => new Map(planOptions.map((option) => [option.id, option.title])),
    [planOptions],
  );

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        const byPriority =
          (PRIORITY_RANK.get(b.priority) ?? 0) - (PRIORITY_RANK.get(a.priority) ?? 0);
        if (byPriority !== 0) return byPriority;
        const byStatus =
          (STATUS_RANK.get(a.goalStatus) ?? 0) - (STATUS_RANK.get(b.goalStatus) ?? 0);
        if (byStatus !== 0) return byStatus;
        return (a.targetDate ?? "9999").localeCompare(b.targetDate ?? "9999");
      }),
    [items],
  );

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(goal: Goal) {
    setEditing(goal);
    setDialogOpen(true);
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Goals"
        description="Measurable goals with milestones, projects, tasks, habits, and KPIs."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button onClick={openCreate} disabled={status === "loading"}>
            <Plus />
            New goal
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
          title="We couldn't load your goals"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Add a measurable goal, link it to a plan, and choose how you'll track progress."
          action={
            <Button onClick={openCreate}>
              <Plus />
              Add your first goal
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              planTitleById={planTitleById}
              onEdit={openEdit}
              onArchive={archive}
            />
          ))}
        </div>
      )}

      <GoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={editing}
        planOptions={planOptions}
        onSubmit={async (values) => {
          const input = goalInputFromForm(values);
          if (editing) await update(editing.id, input);
          else await create(input);
        }}
      />
    </PageContainer>
  );
}
