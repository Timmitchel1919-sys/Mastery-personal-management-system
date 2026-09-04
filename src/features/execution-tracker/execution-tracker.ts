import { computeRoutineProgress } from "@/features/routines/routine-progress";
import type { Routine, RoutineLog } from "@/features/routines/schema";
import { isClosed, daysOverdue } from "@/features/tasks/schema";
import type { Task } from "@/features/tasks/schema";
import { expectedDatesInRange } from "@/features/habits/habit-schedule";
import type { Habit, HabitLog } from "@/features/habits/schema";
import type { DeepWorkSession } from "@/features/deep-work/schema";

/**
 * Execution Tracker (Layer 10D) — closes the Act domain. A **read-only aggregation** over
 * data that already exists on Tasks (10A), Habits (10B), Routines (10C), and Deep Work
 * (9B). No new collection is written here (ADR-0016): the facts this layer reports —
 * status, dates, estimated/actual minutes, resolution reasons, focus quality, energy — are
 * already captured where the work happens, so this module only classifies and sums them
 * for a period. Copy throughout is kept neutral and non-shaming per the spec: "overdue" /
 * "not completed" / "cancelled" are factual states, not judgments.
 */

export const EXECUTION_PERIODS = ["today", "week"] as const;
export type ExecutionPeriod = (typeof EXECUTION_PERIODS)[number];

export const EXECUTION_PERIOD_LABEL: Record<ExecutionPeriod, string> = {
  today: "Today",
  week: "This week",
};

export interface DateRange {
  start: string;
  end: string;
}

/** The inclusive date range for a period, ending today. Pure. */
export function periodRange(period: ExecutionPeriod, today: string): DateRange {
  if (period === "today") return { start: today, end: today };
  const start = new Date(`${today}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 6);
  return { start: start.toISOString().slice(0, 10), end: today };
}

function inRange(date: string, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

function datesBetween(range: DateRange): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${range.start}T00:00:00Z`);
  const end = new Date(`${range.end}T00:00:00Z`);
  for (let step = 0; step <= 366 && cursor.getTime() <= end.getTime(); step += 1) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export interface TaskNonCompletionNote {
  id: string;
  title: string;
  taskStatus: Task["taskStatus"];
  reason: string;
}

export interface TaskExecutionSummary {
  completedOnTime: number;
  completedLater: number;
  cancelled: number;
  overdue: number;
  upcoming: number;
  estimatedMinutes: number;
  actualMinutes: number;
  notes: TaskNonCompletionNote[];
}

/**
 * Classify tasks against a period. A task with a `completedAt` in range is counted as
 * completed (on time or later than its due date) regardless of when it was due. Otherwise
 * a task is counted if its due date falls in range (overdue vs. upcoming) or it was
 * cancelled during the period (approximated by `updatedAt`, since tasks don't keep a
 * cancellation timestamp — see known limitations). Pure.
 */
export function classifyTasks(
  tasks: Task[],
  range: DateRange,
  today: string,
): TaskExecutionSummary {
  const summary: TaskExecutionSummary = {
    completedOnTime: 0,
    completedLater: 0,
    cancelled: 0,
    overdue: 0,
    upcoming: 0,
    estimatedMinutes: 0,
    actualMinutes: 0,
    notes: [],
  };

  function noteIfPresent(task: Task) {
    if (task.resolutionReason.trim()) {
      summary.notes.push({
        id: task.id,
        title: task.title,
        taskStatus: task.taskStatus,
        reason: task.resolutionReason,
      });
    }
  }

  for (const task of tasks) {
    const completedDate = task.completedAt?.slice(0, 10) ?? null;
    if (task.taskStatus === "done" && completedDate && inRange(completedDate, range)) {
      const onTime = !task.dueDate || completedDate <= task.dueDate;
      if (onTime) summary.completedOnTime += 1;
      else summary.completedLater += 1;
      summary.estimatedMinutes += task.estimatedMinutes;
      summary.actualMinutes += task.actualMinutes;
      if (!onTime) noteIfPresent(task);
      continue;
    }

    if (task.taskStatus === "cancelled" && inRange(task.updatedAt.slice(0, 10), range)) {
      summary.cancelled += 1;
      noteIfPresent(task);
      continue;
    }

    if (task.dueDate && inRange(task.dueDate, range) && !isClosed(task.taskStatus)) {
      summary.estimatedMinutes += task.estimatedMinutes;
      summary.actualMinutes += task.actualMinutes;
      if (daysOverdue(task, today) > 0) {
        summary.overdue += 1;
        noteIfPresent(task);
      } else {
        summary.upcoming += 1;
      }
    }
  }

  return summary;
}

// ── Habits ────────────────────────────────────────────────────────────────────
export interface HabitExecutionSummary {
  expected: number;
  completed: number;
  notCompleted: number;
}

/** Sum expected-vs-completed occurrences across all active habits in a period. Pure. */
export function summarizeHabitsForPeriod(
  habits: Habit[],
  logsByHabit: Map<string, HabitLog[]>,
  range: DateRange,
): HabitExecutionSummary {
  let expected = 0;
  let completed = 0;

  for (const habit of habits) {
    if (habit.habitStatus === "paused") continue;
    const anchor = habit.createdAt.slice(0, 10);
    const dates = expectedDatesInRange(habit, anchor, range.start, range.end);
    const completedDates = new Set(
      (logsByHabit.get(habit.id) ?? [])
        .filter((log) => log.logStatus === "completed")
        .map((log) => log.date),
    );
    expected += dates.length;
    completed += dates.filter((date) => completedDates.has(date)).length;
  }

  return { expected, completed, notCompleted: expected - completed };
}

// ── Routines ──────────────────────────────────────────────────────────────────
export interface RoutineExecutionSummary {
  stepsExpected: number;
  stepsCompleted: number;
  minutesPlanned: number;
  minutesCompleted: number;
}

/** Sum step completion across all non-template routines, day by day in a period. Pure. */
export function summarizeRoutinesForPeriod(
  routines: Routine[],
  logs: RoutineLog[],
  range: DateRange,
): RoutineExecutionSummary {
  const logByRoutineAndDate = new Map<string, RoutineLog>();
  for (const log of logs) logByRoutineAndDate.set(`${log.routineId}:${log.date}`, log);

  const summary: RoutineExecutionSummary = {
    stepsExpected: 0,
    stepsCompleted: 0,
    minutesPlanned: 0,
    minutesCompleted: 0,
  };

  const dates = datesBetween(range);
  for (const routine of routines) {
    if (routine.isTemplate) continue;
    for (const date of dates) {
      const log = logByRoutineAndDate.get(`${routine.id}:${date}`);
      const progress = computeRoutineProgress(routine, log);
      summary.stepsExpected += progress.totalSteps;
      summary.stepsCompleted += progress.completedSteps;
      summary.minutesPlanned += progress.totalMinutes;
      summary.minutesCompleted += progress.completedMinutes;
    }
  }

  return summary;
}

// ── Focus & energy (Deep Work, Layer 9B) ────────────────────────────────────────
/** Average `energyLevel` across completed Deep Work sessions, or `null` if none. Pure. */
export function averageEnergyLevel(
  sessions: Pick<DeepWorkSession, "sessionStatus" | "energyLevel">[],
): number | null {
  const completed = sessions.filter((session) => session.sessionStatus === "completed");
  if (completed.length === 0) return null;
  const sum = completed.reduce((total, session) => total + session.energyLevel, 0);
  return Math.round((sum / completed.length) * 10) / 10;
}

// ── Composite ─────────────────────────────────────────────────────────────────
export interface ExecutionSummary {
  period: ExecutionPeriod;
  range: DateRange;
  tasks: TaskExecutionSummary;
  habits: HabitExecutionSummary;
  routines: RoutineExecutionSummary;
}
