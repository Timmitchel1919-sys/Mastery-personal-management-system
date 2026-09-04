"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button, Skeleton } from "@/components/ui";
import { useHabitOptions } from "@/features/habits";
import { useRoutines } from "../use-routines";
import { routineInputFromForm, type Routine } from "../schema";
import { RoutineCard } from "./RoutineCard";
import { RoutineDialog } from "./RoutineDialog";
import { RoutineStats } from "./RoutineStats";

export function RoutinesView() {
  const {
    status,
    routines,
    todayLogByRoutine,
    stats,
    error,
    reload,
    create,
    update,
    archive,
    duplicateTemplate,
    toggleStep,
  } = useRoutines();
  const { options: habitOptions } = useHabitOptions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Routine | null>(null);

  const habitTitleById = useMemo(
    () => new Map(habitOptions.map((option) => [option.id, option.title])),
    [habitOptions],
  );

  const yourRoutines = useMemo(() => routines.filter((routine) => !routine.isTemplate), [routines]);
  const templates = useMemo(() => routines.filter((routine) => routine.isTemplate), [routines]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(routine: Routine) {
    setEditing(routine);
    setDialogOpen(true);
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Daily Routine"
        description="Ordered checklists for your mornings, work blocks, evenings, and any custom flow."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button onClick={openCreate} disabled={status === "loading"}>
            <Plus />
            New routine
          </Button>
        }
      />

      {status === "loading" ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-52" />
            ))}
          </div>
        </div>
      ) : status === "error" ? (
        <ErrorState
          className="min-h-[40vh]"
          title="We couldn't load your routines"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : (
        <>
          <RoutineStats stats={stats} />
          {routines.length === 0 ? (
            <EmptyState
              title="No routines yet"
              description="Lay out a morning, work, or evening routine as an ordered checklist."
              action={
                <Button onClick={openCreate}>
                  <Plus />
                  Add your first routine
                </Button>
              }
            />
          ) : (
            <div className="space-y-6">
              {yourRoutines.length > 0 ? (
                <section className="space-y-3">
                  <h2 className="text-subtle text-sm font-medium">Your routines</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {yourRoutines.map((routine) => (
                      <RoutineCard
                        key={routine.id}
                        routine={routine}
                        todayLog={todayLogByRoutine.get(routine.id)}
                        habitTitleById={habitTitleById}
                        onEdit={openEdit}
                        onArchive={archive}
                        onToggleStep={toggleStep}
                        onDuplicate={duplicateTemplate}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {templates.length > 0 ? (
                <section className="space-y-3">
                  <h2 className="text-subtle text-sm font-medium">Templates</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {templates.map((routine) => (
                      <RoutineCard
                        key={routine.id}
                        routine={routine}
                        todayLog={undefined}
                        habitTitleById={habitTitleById}
                        onEdit={openEdit}
                        onArchive={archive}
                        onToggleStep={toggleStep}
                        onDuplicate={duplicateTemplate}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </>
      )}

      <RoutineDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        routine={editing}
        habitOptions={habitOptions}
        onSubmit={async (values) => {
          const input = routineInputFromForm(values);
          if (editing) await update(editing.id, input);
          else await create(input);
        }}
      />
    </PageContainer>
  );
}
