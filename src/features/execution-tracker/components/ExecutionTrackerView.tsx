"use client";

import type { ReactNode } from "react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { ErrorState } from "@/components/shared";
import { MetricCard } from "@/components/mastery";
import {
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/components/ui";
import {
  EXECUTION_PERIODS,
  EXECUTION_PERIOD_LABEL,
  type ExecutionPeriod,
} from "../execution-tracker";
import { useExecutionTracker } from "../use-execution-tracker";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function ExecutionTrackerView() {
  const { status, error, period, setPeriod, summary, focusEnergy, reload } = useExecutionTracker();
  const { tasks, habits, routines } = summary;

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Execution Tracker"
        description="A neutral look at planned versus completed work — for understanding your rhythm, not scoring it."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Select value={period} onValueChange={(value) => setPeriod(value as ExecutionPeriod)}>
            <SelectTrigger aria-label="Period" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXECUTION_PERIODS.map((value) => (
                <SelectItem key={value} value={value}>
                  {EXECUTION_PERIOD_LABEL[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {status === "loading" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-28" />
          ))}
        </div>
      ) : status === "error" ? (
        <ErrorState
          className="min-h-[40vh]"
          title="We couldn't load your execution summary"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : (
        <div className="space-y-8">
          <Section title="Tasks">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <MetricCard label="Completed on time" value={String(tasks.completedOnTime)} />
              <MetricCard label="Completed later" value={String(tasks.completedLater)} />
              <MetricCard label="Past due, still open" value={String(tasks.overdue)} />
              <MetricCard label="Upcoming" value={String(tasks.upcoming)} />
              <MetricCard label="Cancelled" value={String(tasks.cancelled)} />
            </div>
            <p className="text-subtle text-sm">
              {tasks.actualMinutes} of {tasks.estimatedMinutes} estimated minutes logged.
            </p>
            {tasks.notes.length > 0 ? (
              <div className="space-y-2">
                <p className="text-subtle text-xs">
                  Context recorded for these — for understanding what happened, not a scorecard.
                </p>
                <ul className="space-y-1.5">
                  {tasks.notes.map((note) => (
                    <li key={note.id} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="mt-0.5 shrink-0">
                        {note.taskStatus}
                      </Badge>
                      <span className="min-w-0">
                        <span className="font-medium">{note.title}</span>
                        <span className="text-subtle"> — {note.reason}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Section>

          <Section title="Habits">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <MetricCard label="Expected" value={String(habits.expected)} />
              <MetricCard label="Completed" value={String(habits.completed)} />
              <MetricCard label="Not completed" value={String(habits.notCompleted)} />
            </div>
          </Section>

          <Section title="Routines">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard
                label="Steps completed"
                value={`${routines.stepsCompleted}/${routines.stepsExpected}`}
              />
              <MetricCard
                label="Minutes"
                value={`${routines.minutesCompleted}/${routines.minutesPlanned}`}
              />
            </div>
          </Section>

          <Section title="Focus & energy">
            <p className="text-subtle text-sm">From your recent Deep Work sessions.</p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <MetricCard
                label="Avg. focus quality"
                value={
                  focusEnergy.avgFocusQuality === null ? "—" : `${focusEnergy.avgFocusQuality}/5`
                }
              />
              <MetricCard
                label="Avg. energy"
                value={
                  focusEnergy.avgEnergyLevel === null ? "—" : `${focusEnergy.avgEnergyLevel}/5`
                }
              />
              <MetricCard
                label="Focus minutes (7d)"
                value={String(focusEnergy.focusMinutesLast7Days)}
              />
            </div>
          </Section>
        </div>
      )}
    </PageContainer>
  );
}
