"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button, Skeleton } from "@/components/ui";
import { useGoalOptions } from "@/features/goals";
import { useProjectOptions } from "@/features/projects";
import { useMilestones } from "../use-milestones";
import { milestoneInputFromForm, type Milestone, type MilestoneStatus } from "../schema";
import { MilestoneCard } from "./MilestoneCard";
import { MilestoneDialog } from "./MilestoneDialog";

const STATUS_ORDER: MilestoneStatus[] = ["in-progress", "upcoming", "missed", "done"];
const STATUS_RANK = new Map(STATUS_ORDER.map((status, index) => [status, index]));

export function MilestonesView() {
  const { status, items, error, reload, create, update, archive } = useMilestones();
  const { options: goalOptions } = useGoalOptions();
  const { options: projectOptions } = useProjectOptions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);

  const parentTitleById = useMemo(
    () =>
      new Map<string, string>([
        ...goalOptions.map((option) => [option.id, option.title] as const),
        ...projectOptions.map((option) => [option.id, option.title] as const),
      ]),
    [goalOptions, projectOptions],
  );

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        const byStatus =
          (STATUS_RANK.get(a.milestoneStatus) ?? 0) - (STATUS_RANK.get(b.milestoneStatus) ?? 0);
        if (byStatus !== 0) return byStatus;
        return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
      }),
    [items],
  );

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(milestone: Milestone) {
    setEditing(milestone);
    setDialogOpen(true);
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Milestones"
        description="Checkpoints on the way to your goals and projects."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button onClick={openCreate} disabled={status === "loading"}>
            <Plus />
            New milestone
          </Button>
        }
      />

      {status === "loading" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-48" />
          ))}
        </div>
      ) : status === "error" ? (
        <ErrorState
          className="min-h-[40vh]"
          title="We couldn't load your milestones"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No milestones yet"
          description="Add a checkpoint, link it to a goal or project, and give it a due date."
          action={
            <Button onClick={openCreate}>
              <Plus />
              Add your first milestone
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              parentTitleById={parentTitleById}
              onEdit={openEdit}
              onArchive={archive}
            />
          ))}
        </div>
      )}

      <MilestoneDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        milestone={editing}
        goalOptions={goalOptions}
        projectOptions={projectOptions}
        onSubmit={async (values) => {
          const input = milestoneInputFromForm(values);
          if (editing) await update(editing.id, input);
          else await create(input);
        }}
      />
    </PageContainer>
  );
}
