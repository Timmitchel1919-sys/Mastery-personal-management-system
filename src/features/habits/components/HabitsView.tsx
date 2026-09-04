"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button, Skeleton } from "@/components/ui";
import { useGoalOptions } from "@/features/goals";
import { useMounted } from "@/hooks/use-mounted";
import { useHabits } from "../use-habits";
import { habitInputFromForm, type Habit } from "../schema";
import { HabitCard } from "./HabitCard";
import { HabitDialog } from "./HabitDialog";
import { HabitStats } from "./HabitStats";

export function HabitsView() {
  const {
    status,
    habits,
    logsByHabit,
    streaksByHabit,
    recentDaysByHabit,
    stats,
    error,
    reload,
    create,
    update,
    archive,
    setDayStatus,
  } = useHabits();
  const { options: goalOptions } = useGoalOptions();
  const mounted = useMounted();
  const today = mounted ? new Date().toISOString().slice(0, 10) : "";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);

  const goalTitleById = useMemo(
    () => new Map(goalOptions.map((option) => [option.id, option.title])),
    [goalOptions],
  );

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(habit: Habit) {
    setEditing(habit);
    setDialogOpen(true);
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Habits"
        description="Build streaks in spiritual disciplines, health, learning, and routines."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button onClick={openCreate} disabled={status === "loading"}>
            <Plus />
            New habit
          </Button>
        }
      />

      {status === "loading" || !mounted ? (
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
          title="We couldn't load your habits"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : (
        <>
          <HabitStats stats={stats} />
          {habits.length === 0 ? (
            <EmptyState
              title="No habits yet"
              description="Add a recurring practice — a streak builds automatically from the days you log."
              action={
                <Button onClick={openCreate}>
                  <Plus />
                  Add your first habit
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  today={today}
                  streak={streaksByHabit.get(habit.id) ?? { currentStreak: 0, longestStreak: 0 }}
                  recentDays={recentDaysByHabit.get(habit.id) ?? []}
                  goalTitleById={goalTitleById}
                  todayLogStatus={
                    (logsByHabit.get(habit.id) ?? []).find((log) => log.date === today)
                      ?.logStatus ?? null
                  }
                  onEdit={openEdit}
                  onArchive={archive}
                  onSetToday={(habitId, logStatus) => setDayStatus(habitId, today, logStatus)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <HabitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        habit={editing}
        goalOptions={goalOptions}
        onSubmit={async (values) => {
          const input = habitInputFromForm(values);
          if (editing) await update(editing.id, input);
          else await create(input);
        }}
      />
    </PageContainer>
  );
}
