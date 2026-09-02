"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { ErrorState } from "@/components/shared";
import { Button, Card, CardContent, Skeleton } from "@/components/ui";
import { useGoalOptions } from "@/features/goals";
import { useProjectOptions } from "@/features/projects";
import { cn } from "@/lib/utils";
import { usePriorityMatrix } from "../use-priority-matrix";
import {
  MATRIX_QUADRANT_META,
  MATRIX_QUADRANTS,
  matrixItemInputFromForm,
  type MatrixItem,
  type MatrixQuadrant,
} from "../schema";
import { MatrixItemCard } from "./MatrixItemCard";
import { MatrixItemDialog } from "./MatrixItemDialog";

const QUADRANT_ACCENT: Record<MatrixQuadrant, string> = {
  do: "border-l-danger",
  schedule: "border-l-success",
  delegate: "border-l-warning",
  eliminate: "border-l-border-strong",
};

export function PriorityMatrixView() {
  const {
    status,
    byQuadrant,
    stats,
    error,
    reload,
    create,
    update,
    archive,
    move,
    toggleComplete,
  } = usePriorityMatrix();
  const { options: goalOptions } = useGoalOptions();
  const { options: projectOptions } = useProjectOptions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MatrixItem | null>(null);
  const [presetQuadrant, setPresetQuadrant] = useState<MatrixQuadrant>("do");

  const goalTitleById = useMemo(
    () => new Map(goalOptions.map((option) => [option.id, option.title])),
    [goalOptions],
  );
  const projectTitleById = useMemo(
    () => new Map(projectOptions.map((option) => [option.id, option.title])),
    [projectOptions],
  );

  function openCreate(quadrant: MatrixQuadrant) {
    setEditing(null);
    setPresetQuadrant(quadrant);
    setDialogOpen(true);
  }

  function openEdit(item: MatrixItem) {
    setEditing(item);
    setDialogOpen(true);
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Priority Matrix"
        description="Sort what matters across the urgent / important quadrants, and move items as things change."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button onClick={() => openCreate("do")} disabled={status === "loading"}>
            <Plus />
            New item
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
          title="We couldn't load your priority matrix"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : (
        <>
          <p className="text-subtle text-sm">
            {stats.open} open · {stats.completed} completed
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {MATRIX_QUADRANTS.map((quadrant) => {
              const meta = MATRIX_QUADRANT_META[quadrant];
              const items = byQuadrant[quadrant];
              return (
                <Card key={quadrant} className={cn("border-l-4", QUADRANT_ACCENT[quadrant])}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-semibold">{meta.label}</h2>
                        <p className="text-subtle text-xs">
                          {meta.summary} · {meta.advice}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCreate(quadrant)}
                        aria-label={`Add item to ${meta.label}`}
                      >
                        <Plus />
                        Add
                      </Button>
                    </div>

                    {items.length === 0 ? (
                      <p className="text-subtle rounded-md border border-dashed px-3 py-6 text-center text-xs">
                        Nothing here yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {items.map((item) => (
                          <MatrixItemCard
                            key={item.id}
                            item={item}
                            goalTitleById={goalTitleById}
                            projectTitleById={projectTitleById}
                            onEdit={openEdit}
                            onArchive={archive}
                            onMove={move}
                            onToggleComplete={toggleComplete}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <MatrixItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        presetQuadrant={presetQuadrant}
        goalOptions={goalOptions}
        projectOptions={projectOptions}
        onSubmit={async (values) => {
          const input = matrixItemInputFromForm(values);
          if (editing) await update(editing.id, input);
          else await create(input);
        }}
      />
    </PageContainer>
  );
}
