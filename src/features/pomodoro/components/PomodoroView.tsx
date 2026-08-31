"use client";

import { useMemo } from "react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { ErrorState } from "@/components/shared";
import { Skeleton } from "@/components/ui";
import { useGoalOptions } from "@/features/goals";
import { useProjectOptions } from "@/features/projects";
import { usePomodoro } from "../use-pomodoro";
import { usePomodoroHistory } from "../use-pomodoro-history";
import { PomodoroHistoryList } from "./PomodoroHistoryList";
import { PomodoroStats } from "./PomodoroStats";
import { PomodoroTimer } from "./PomodoroTimer";

export function PomodoroView() {
  const { status, sessions, stats, error, reload } = usePomodoroHistory();
  const { state, start, pause, resume, skip, cancel } = usePomodoro({ onSaved: reload });
  const { options: goalOptions } = useGoalOptions();
  const { options: projectOptions } = useProjectOptions();

  const goalTitleById = useMemo(
    () => new Map(goalOptions.map((option) => [option.id, option.title])),
    [goalOptions],
  );
  const projectTitleById = useMemo(
    () => new Map(projectOptions.map((option) => [option.id, option.title])),
    [projectOptions],
  );

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Pomodoro"
        description="Configurable focus cycles. The timer keeps running across reloads and pages."
        breadcrumbs={<BreadcrumbTrail />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <PomodoroTimer
          state={state}
          onStart={start}
          onPause={pause}
          onResume={resume}
          onSkip={skip}
          onCancel={cancel}
        />

        <div className="space-y-6">
          {status === "loading" ? (
            <>
              <Skeleton className="h-24" />
              <Skeleton className="h-48" />
            </>
          ) : status === "error" ? (
            <ErrorState
              title="We couldn't load your focus history"
              description={error ?? "Please try again."}
              onRetry={reload}
            />
          ) : (
            <>
              <PomodoroStats stats={stats} />
              <section className="space-y-2">
                <h2 className="text-sm font-medium">Recent sessions</h2>
                <PomodoroHistoryList
                  sessions={sessions}
                  goalTitleById={goalTitleById}
                  projectTitleById={projectTitleById}
                />
              </section>
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
