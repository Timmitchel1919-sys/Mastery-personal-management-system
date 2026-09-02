"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import { Alert, AlertDescription, AlertTitle, Button, Skeleton } from "@/components/ui";
import { isoToWall } from "@/features/calendar";
import { useGoalOptions } from "@/features/goals";
import { useProjectOptions } from "@/features/projects";
import { useTimeBlocking } from "../use-time-blocking";
import { timeBlockInputFromForm, type TimeBlock } from "../schema";
import { TimeBlockCard } from "./TimeBlockCard";
import { TimeBlockDialog } from "./TimeBlockDialog";
import { TimeBlockStats } from "./TimeBlockStats";

function dayLabel(block: TimeBlock): string {
  return isoToWall(block.startDateTime, block.timeZone).date;
}

export function TimeBlockView() {
  const { status, items, conflicts, stats, error, reload, create, update, archive } =
    useTimeBlocking();
  const { options: goalOptions } = useGoalOptions();
  const { options: projectOptions } = useProjectOptions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TimeBlock | null>(null);

  const goalTitleById = useMemo(
    () => new Map(goalOptions.map((option) => [option.id, option.title])),
    [goalOptions],
  );
  const projectTitleById = useMemo(
    () => new Map(projectOptions.map((option) => [option.id, option.title])),
    [projectOptions],
  );

  const groups = useMemo(() => {
    const byDay = new Map<string, TimeBlock[]>();
    for (const block of items) {
      const key = dayLabel(block);
      byDay.set(key, [...(byDay.get(key) ?? []), block]);
    }
    return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(block: TimeBlock) {
    setEditing(block);
    setDialogOpen(true);
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Time Blocking"
        description="Allocate time to your work, habits, and commitments — overlaps are flagged."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button onClick={openCreate} disabled={status === "loading"}>
            <Plus />
            New block
          </Button>
        }
      />

      {status === "loading" ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-40" />
            ))}
          </div>
        </div>
      ) : status === "error" ? (
        <ErrorState
          className="min-h-[40vh]"
          title="We couldn't load your time blocks"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : (
        <>
          <TimeBlockStats stats={stats} />

          {conflicts.size > 0 ? (
            <Alert variant="warning">
              <AlertTriangle />
              <AlertTitle>Scheduling conflict</AlertTitle>
              <AlertDescription>
                {conflicts.size} block{conflicts.size === 1 ? "" : "s"} overlap
                {conflicts.size === 1 ? "s" : ""} another block. Overlapping blocks are marked
                below.
              </AlertDescription>
            </Alert>
          ) : null}

          {items.length === 0 ? (
            <EmptyState
              title="No time blocks yet"
              description="Block out time for an activity — a deep-work session, a habit, a personal commitment."
              action={
                <Button onClick={openCreate}>
                  <Plus />
                  Add your first block
                </Button>
              }
            />
          ) : (
            <div className="space-y-6">
              {groups.map(([day, dayBlocks]) => (
                <section key={day} className="space-y-3">
                  <h2 className="text-subtle text-sm font-medium">{day}</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {dayBlocks.map((block) => (
                      <TimeBlockCard
                        key={block.id}
                        block={block}
                        conflict={conflicts.has(block.id)}
                        goalTitleById={goalTitleById}
                        projectTitleById={projectTitleById}
                        onEdit={openEdit}
                        onArchive={archive}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      <TimeBlockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        block={editing}
        goalOptions={goalOptions}
        projectOptions={projectOptions}
        onSubmit={async (values) => {
          const input = timeBlockInputFromForm(values);
          if (editing) await update(editing.id, input);
          else await create(input);
        }}
      />
    </PageContainer>
  );
}
