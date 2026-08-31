"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button, Skeleton } from "@/components/ui";
import { useGoalOptions } from "@/features/goals";
import { useProjectOptions } from "@/features/projects";
import { useDeepWork } from "../use-deep-work";
import { deepWorkInputFromForm, type DeepWorkSession } from "../schema";
import { DeepWorkCard } from "./DeepWorkCard";
import { DeepWorkDialog } from "./DeepWorkDialog";
import { DeepWorkStats } from "./DeepWorkStats";

export function DeepWorkView() {
  const { status, items, stats, error, reload, create, update, archive } = useDeepWork();
  const { options: goalOptions } = useGoalOptions();
  const { options: projectOptions } = useProjectOptions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DeepWorkSession | null>(null);

  const goalTitleById = useMemo(
    () => new Map(goalOptions.map((option) => [option.id, option.title])),
    [goalOptions],
  );
  const projectTitleById = useMemo(
    () => new Map(projectOptions.map((option) => [option.id, option.title])),
    [projectOptions],
  );

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(session: DeepWorkSession) {
    setEditing(session);
    setDialogOpen(true);
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Deep Work"
        description="Log focused sessions with an intended outcome, a distraction log, and a focus score."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button onClick={openCreate} disabled={status === "loading"}>
            <Plus />
            New session
          </Button>
        }
      />

      {status === "loading" ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-44" />
            ))}
          </div>
        </div>
      ) : status === "error" ? (
        <ErrorState
          className="min-h-[40vh]"
          title="We couldn't load your deep work log"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : (
        <>
          <DeepWorkStats stats={stats} />
          {items.length === 0 ? (
            <EmptyState
              title="No deep work sessions yet"
              description="Log a session — its intent, timing, distractions, and how focused it felt."
              action={
                <Button onClick={openCreate}>
                  <Plus />
                  Log your first session
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((session) => (
                <DeepWorkCard
                  key={session.id}
                  session={session}
                  goalTitleById={goalTitleById}
                  projectTitleById={projectTitleById}
                  onEdit={openEdit}
                  onArchive={archive}
                />
              ))}
            </div>
          )}
        </>
      )}

      <DeepWorkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        session={editing}
        goalOptions={goalOptions}
        projectOptions={projectOptions}
        onSubmit={async (values) => {
          const input = deepWorkInputFromForm(values);
          if (editing) await update(editing.id, input);
          else await create(input);
        }}
      />
    </PageContainer>
  );
}
