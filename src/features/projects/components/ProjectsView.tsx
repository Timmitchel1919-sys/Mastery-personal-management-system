"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button, Skeleton } from "@/components/ui";
import { useGoalOptions } from "@/features/goals";
import { PRIORITIES } from "@/lib/validation/domain";
import { useProjects } from "../use-projects";
import { PROJECT_STATUSES, projectInputFromForm, type Project } from "../schema";
import { ProjectCard } from "./ProjectCard";
import { ProjectDialog } from "./ProjectDialog";

const PRIORITY_RANK = new Map(
  PRIORITIES.map((priority, index) => [priority, PRIORITIES.length - index]),
);
const STATUS_RANK = new Map(PROJECT_STATUSES.map((status, index) => [status, index]));

export function ProjectsView() {
  const { status, items, error, reload, create, update, archive } = useProjects();
  const { options: goalOptions } = useGoalOptions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const goalTitleById = useMemo(
    () => new Map(goalOptions.map((option) => [option.id, option.title])),
    [goalOptions],
  );

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        const byPriority =
          (PRIORITY_RANK.get(b.priority) ?? 0) - (PRIORITY_RANK.get(a.priority) ?? 0);
        if (byPriority !== 0) return byPriority;
        const byStatus =
          (STATUS_RANK.get(a.projectStatus) ?? 0) - (STATUS_RANK.get(b.projectStatus) ?? 0);
        if (byStatus !== 0) return byStatus;
        return (a.endDate ?? "9999").localeCompare(b.endDate ?? "9999");
      }),
    [items],
  );

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(project: Project) {
    setEditing(project);
    setDialogOpen(true);
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Projects"
        description="Project delivery with milestones, dependencies, and risks."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button onClick={openCreate} disabled={status === "loading"}>
            <Plus />
            New project
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
          title="We couldn't load your projects"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Add a project, link it to a goal, and capture its outcome, dependencies, and risks."
          action={
            <Button onClick={openCreate}>
              <Plus />
              Add your first project
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              goalTitleById={goalTitleById}
              onEdit={openEdit}
              onArchive={archive}
            />
          ))}
        </div>
      )}

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editing}
        goalOptions={goalOptions}
        onSubmit={async (values) => {
          const input = projectInputFromForm(values);
          if (editing) await update(editing.id, input);
          else await create(input);
        }}
      />
    </PageContainer>
  );
}
