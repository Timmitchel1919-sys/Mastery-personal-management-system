"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button, Skeleton } from "@/components/ui";
import { NextBestActionCard, pickNextBestTask } from "@/features/actions";
import { useGoalOptions } from "@/features/goals";
import { useMilestoneOptions } from "@/features/milestones";
import { useProjectOptions } from "@/features/projects";
import { useMounted } from "@/hooks/use-mounted";
import { useTasks } from "../use-tasks";
import { taskInputFromForm, type Task } from "../schema";
import { TaskCard } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";
import { TaskStats } from "./TaskStats";

export function TasksView() {
  const {
    status,
    items,
    stats,
    subtaskProgress,
    error,
    reload,
    create,
    update,
    archive,
    setStatusFor,
  } = useTasks();
  const { options: goalOptions } = useGoalOptions();
  const { options: projectOptions } = useProjectOptions();
  const { options: milestoneOptions } = useMilestoneOptions();
  const mounted = useMounted();
  const today = mounted ? new Date().toISOString().slice(0, 10) : "";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [dismissedNextId, setDismissedNextId] = useState<string | null>(null);

  const nextBest = useMemo(
    () => (today ? pickNextBestTask(items, today) : null),
    [items, today],
  );

  const goalTitleById = useMemo(
    () => new Map(goalOptions.map((option) => [option.id, option.title])),
    [goalOptions],
  );
  const projectTitleById = useMemo(
    () => new Map(projectOptions.map((option) => [option.id, option.title])),
    [projectOptions],
  );
  const milestoneTitleById = useMemo(
    () => new Map(milestoneOptions.map((option) => [option.id, option.title])),
    [milestoneOptions],
  );
  const taskTitleById = useMemo(() => new Map(items.map((task) => [task.id, task.title])), [items]);
  const taskOptions = useMemo(
    () =>
      items
        .filter((task) => task.taskStatus !== "done" && task.taskStatus !== "cancelled")
        .map((task) => ({ id: task.id, title: task.title })),
    [items],
  );

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(task: Task) {
    setEditing(task);
    setDialogOpen(true);
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Tasks"
        description="The unit of daily execution — status, priority, dates, and links up to your plans."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button onClick={openCreate} disabled={status === "loading"}>
            <Plus />
            New task
          </Button>
        }
      />

      {status === "loading" ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <div className="space-y-3">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-28" />
            ))}
          </div>
        </div>
      ) : status === "error" ? (
        <ErrorState
          className="min-h-[40vh]"
          title="We couldn't load your tasks"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : (
        <>
          <TaskStats stats={stats} />

          {nextBest && nextBest.task.id !== dismissedNextId ? (
            <NextBestActionCard
              title={nextBest.task.title}
              why={nextBest.why}
              startLabel="Start now"
              onStart={() => setStatusFor(nextBest.task, "in-progress")}
              scheduleLabel="Schedule"
              onSchedule={() => openEdit(nextBest.task)}
              onDismiss={() => setDismissedNextId(nextBest.task.id)}
            />
          ) : null}

          {items.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              description="Add the first thing you need to get done — link it to a goal or project if it belongs to one."
              action={
                <Button onClick={openCreate}>
                  <Plus />
                  Add your first task
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {items.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  today={today}
                  goalTitleById={goalTitleById}
                  projectTitleById={projectTitleById}
                  milestoneTitleById={milestoneTitleById}
                  taskTitleById={taskTitleById}
                  subtasks={subtaskProgress.get(task.id)}
                  onEdit={openEdit}
                  onArchive={archive}
                  onToggleDone={(t, done) => setStatusFor(t, done ? "done" : "todo")}
                />
              ))}
            </div>
          )}
        </>
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        goalOptions={goalOptions}
        projectOptions={projectOptions}
        milestoneOptions={milestoneOptions}
        taskOptions={taskOptions}
        onSubmit={async (values) => {
          const input = taskInputFromForm(values, editing?.completedAt ?? null);
          if (editing) await update(editing.id, input);
          else await create(input);
        }}
      />
    </PageContainer>
  );
}
