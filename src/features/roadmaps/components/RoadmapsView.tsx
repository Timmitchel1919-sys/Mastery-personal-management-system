"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button, Skeleton } from "@/components/ui";
import { useGoalOptions } from "@/features/goals";
import { useProjectOptions } from "@/features/projects";
import { useRoadmaps } from "../use-roadmaps";
import { ROADMAP_STATUSES, roadmapInputFromForm, type Roadmap } from "../schema";
import { RoadmapCard } from "./RoadmapCard";
import { RoadmapDialog } from "./RoadmapDialog";

const STATUS_RANK = new Map(ROADMAP_STATUSES.map((status, index) => [status, index]));

export function RoadmapsView() {
  const { status, items, error, reload, create, update, archive } = useRoadmaps();
  const { options: goalOptions } = useGoalOptions();
  const { options: projectOptions } = useProjectOptions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Roadmap | null>(null);

  const goalTitleById = useMemo(
    () => new Map(goalOptions.map((option) => [option.id, option.title])),
    [goalOptions],
  );
  const projectTitleById = useMemo(
    () => new Map(projectOptions.map((option) => [option.id, option.title])),
    [projectOptions],
  );

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        const byStatus =
          (STATUS_RANK.get(a.roadmapStatus) ?? 0) - (STATUS_RANK.get(b.roadmapStatus) ?? 0);
        if (byStatus !== 0) return byStatus;
        return (a.startDate ?? "9999").localeCompare(b.startDate ?? "9999");
      }),
    [items],
  );

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(roadmap: Roadmap) {
    setEditing(roadmap);
    setDialogOpen(true);
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Roadmaps"
        description="Timeline plans made of phases — for goals, projects, skills, and programs."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button onClick={openCreate} disabled={status === "loading"}>
            <Plus />
            New roadmap
          </Button>
        }
      />

      {status === "loading" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-60" />
          ))}
        </div>
      ) : status === "error" ? (
        <ErrorState
          className="min-h-[40vh]"
          title="We couldn't load your roadmaps"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No roadmaps yet"
          description="Add a roadmap, choose what it covers, and lay out its phases along a timeline."
          action={
            <Button onClick={openCreate}>
              <Plus />
              Add your first roadmap
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((roadmap) => (
            <RoadmapCard
              key={roadmap.id}
              roadmap={roadmap}
              goalTitleById={goalTitleById}
              projectTitleById={projectTitleById}
              onEdit={openEdit}
              onArchive={archive}
            />
          ))}
        </div>
      )}

      <RoadmapDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        roadmap={editing}
        goalOptions={goalOptions}
        projectOptions={projectOptions}
        onSubmit={async (values) => {
          const input = roadmapInputFromForm(values);
          if (editing) await update(editing.id, input);
          else await create(input);
        }}
      />
    </PageContainer>
  );
}
