import { goalRepository } from "@/features/goals/goal-repository";
import { milestoneRepository } from "@/features/milestones/milestone-repository";
import { taskRepository } from "@/features/tasks/task-repository";
import { habitRepository } from "@/features/habits/habit-repository";
import { habitLogRepository } from "@/features/habits/habit-log-repository";
import { deepWorkRepository } from "@/features/deep-work/deep-work-repository";
import { kpiRepository } from "@/features/kpis/kpi-repository";
import { kpiEntryRepository } from "@/features/kpis/kpi-entry-repository";
import type { ReportSection } from "./report-schema";

/**
 * Composes a report from the domain repositories (Layer 16). Every read here is a
 * user-scoped repository `list()` — **no Recovery Center collection is ever touched**, so a
 * report can never leak recovery data (`docs/PRODUCT_REQUIREMENTS.md` §11). Each section is
 * computed only when it was requested; an un-requested section is `null`. Like the rest of
 * the app the reads are capped at one page per collection (the working set is expected to
 * be small) — see the Layer 16 known limitations.
 */

export interface ReportRange {
  start: string;
  end: string;
}

export interface ReportSummary {
  goalsAchieved: number;
  milestonesCompleted: number;
  tasksCompleted: number;
  focusMinutes: number;
  habitConsistencyPercent: number | null;
  activeKpis: number;
}

export interface ReportGoalsSection {
  achieved: { title: string }[];
  inProgress: { title: string; progress: number }[];
  milestonesCompleted: { title: string }[];
}

export interface ReportHabitsSection {
  overallPercent: number | null;
  perHabit: { title: string; completed: number; expected: number; percent: number }[];
}

export interface ReportFocusSection {
  totalMinutes: number;
  sessionCount: number;
  longestMinutes: number;
  averageMinutes: number;
}

export interface ReportKpiRow {
  title: string;
  unit: string;
  direction: "higher-is-better" | "lower-is-better";
  from: number | null;
  to: number | null;
  change: number | null;
}

export interface ReportPlanningSection {
  completedOnTime: number;
  completedLate: number;
  cancelled: number;
  stillOverdue: number;
}

export interface ReportData {
  range: ReportRange;
  generatedAt: string;
  sections: ReportSection[];
  summary: ReportSummary | null;
  goals: ReportGoalsSection | null;
  habits: ReportHabitsSection | null;
  focus: ReportFocusSection | null;
  kpis: ReportKpiRow[] | null;
  planning: ReportPlanningSection | null;
}

const PAGE = 100;

/** `YYYY-MM-DD` or an ISO datetime -> the date part; inclusive range test. */
function inRange(value: string | null | undefined, range: ReportRange): boolean {
  if (!value) return false;
  const day = value.slice(0, 10);
  return day >= range.start && day <= range.end;
}

function daysInRange(range: ReportRange): number {
  const start = Date.parse(`${range.start}T00:00:00Z`);
  const end = Date.parse(`${range.end}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 1;
  return Math.round((end - start) / 86_400_000) + 1;
}

export async function buildReportData(
  range: ReportRange,
  sections: ReportSection[],
): Promise<ReportData> {
  const want = new Set(sections);
  const needGoals = want.has("summary") || want.has("goals");
  const needTasks = want.has("summary") || want.has("planning");
  const needHabits = want.has("summary") || want.has("habits");
  const needFocus = want.has("summary") || want.has("focus");
  const needKpis = want.has("summary") || want.has("kpis");
  const needMilestones = want.has("summary") || want.has("goals");

  const [
    goalsPage,
    milestonesPage,
    tasksPage,
    habitsPage,
    habitLogsPage,
    focusPage,
    kpisPage,
    kpiEntriesPage,
  ] = await Promise.all([
    needGoals ? goalRepository.list({ limit: PAGE, orderBy: "createdAt", direction: "asc" }) : null,
    needMilestones
      ? milestoneRepository.list({ limit: PAGE, orderBy: "createdAt", direction: "asc" })
      : null,
    needTasks ? taskRepository.list({ limit: PAGE, orderBy: "createdAt", direction: "asc" }) : null,
    needHabits
      ? habitRepository.list({ limit: PAGE, orderBy: "createdAt", direction: "asc" })
      : null,
    needHabits
      ? habitLogRepository.list({ limit: PAGE, orderBy: "date", direction: "desc" })
      : null,
    needFocus
      ? deepWorkRepository.list({ limit: PAGE, orderBy: "createdAt", direction: "desc" })
      : null,
    needKpis ? kpiRepository.list({ limit: PAGE, orderBy: "createdAt", direction: "asc" }) : null,
    needKpis ? kpiEntryRepository.list({ limit: PAGE, orderBy: "date", direction: "asc" }) : null,
  ]);

  const goals = (goalsPage?.items ?? []).filter((g) => g.status === "active");
  const milestones = (milestonesPage?.items ?? []).filter((m) => m.status === "active");
  const tasks = (tasksPage?.items ?? []).filter((t) => t.status === "active");
  const habits = (habitsPage?.items ?? []).filter((h) => h.status === "active");
  const habitLogs = (habitLogsPage?.items ?? []).filter((l) => l.status === "active");
  const focusSessions = (focusPage?.items ?? []).filter((s) => s.status === "active");
  const kpis = (kpisPage?.items ?? []).filter((k) => k.status === "active");
  const kpiEntries = (kpiEntriesPage?.items ?? []).filter((e) => e.status === "active");

  // ── Goals & milestones ─────────────────────────────────────────────────────
  const achievedGoals = goals
    .filter((g) => g.goalStatus === "achieved" && inRange(g.updatedAt, range))
    .map((g) => ({ title: g.title }));
  const inProgressGoals = goals
    .filter((g) => g.goalStatus === "in-progress" || g.goalStatus === "not-started")
    .map((g) => ({ title: g.title, progress: g.progress }));
  const completedMilestones = milestones
    .filter((m) => m.milestoneStatus === "done" && inRange(m.updatedAt, range))
    .map((m) => ({ title: m.title }));

  const goalsSection: ReportGoalsSection = {
    achieved: achievedGoals,
    inProgress: inProgressGoals,
    milestonesCompleted: completedMilestones,
  };

  // ── Habits ─────────────────────────────────────────────────────────────────
  const span = daysInRange(range);
  const perHabit = habits.map((habit) => {
    const completed = habitLogs.filter(
      (log) =>
        log.habitId === habit.id && log.logStatus === "completed" && inRange(log.date, range),
    ).length;
    const expected = span;
    return {
      title: habit.title,
      completed,
      expected,
      percent: expected > 0 ? Math.round((completed / expected) * 100) : 0,
    };
  });
  const habitConsistencyPercent =
    perHabit.length === 0
      ? null
      : Math.round(perHabit.reduce((sum, h) => sum + h.percent, 0) / perHabit.length);
  const habitsSection: ReportHabitsSection = { overallPercent: habitConsistencyPercent, perHabit };

  // ── Focus ──────────────────────────────────────────────────────────────────
  const inRangeFocus = focusSessions.filter((s) => inRange(s.startedAt, range));
  const focusMinutes = inRangeFocus.reduce((sum, s) => sum + (s.actualMinutes ?? 0), 0);
  const focusSection: ReportFocusSection = {
    totalMinutes: focusMinutes,
    sessionCount: inRangeFocus.length,
    longestMinutes: inRangeFocus.reduce((max, s) => Math.max(max, s.actualMinutes ?? 0), 0),
    averageMinutes: inRangeFocus.length > 0 ? Math.round(focusMinutes / inRangeFocus.length) : 0,
  };

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const kpiRows: ReportKpiRow[] = kpis.map((kpi) => {
    const readings = kpiEntries
      .filter((e) => e.kpiId === kpi.id && inRange(e.date, range))
      .sort((a, b) => a.date.localeCompare(b.date));
    const from = readings.length > 1 ? readings[0]!.value : null;
    const to = readings.length > 0 ? readings[readings.length - 1]!.value : null;
    return {
      title: kpi.title,
      unit: kpi.unit,
      direction: kpi.direction,
      from,
      to,
      change: from !== null && to !== null ? Math.round((to - from) * 100) / 100 : null,
    };
  });

  // ── Planning vs execution ──────────────────────────────────────────────────
  const planning: ReportPlanningSection = {
    completedOnTime: 0,
    completedLate: 0,
    cancelled: 0,
    stillOverdue: 0,
  };
  for (const task of tasks) {
    const completedAt = task.completedAt ? task.completedAt.slice(0, 10) : null;
    if (task.taskStatus === "done" && inRange(completedAt, range)) {
      if (!task.dueDate || (completedAt && completedAt <= task.dueDate))
        planning.completedOnTime += 1;
      else planning.completedLate += 1;
    } else if (task.taskStatus === "cancelled" && inRange(task.updatedAt, range)) {
      planning.cancelled += 1;
    } else if (
      task.taskStatus !== "done" &&
      task.taskStatus !== "cancelled" &&
      task.dueDate &&
      task.dueDate < range.end
    ) {
      planning.stillOverdue += 1;
    }
  }

  const summary: ReportSummary = {
    goalsAchieved: achievedGoals.length,
    milestonesCompleted: completedMilestones.length,
    tasksCompleted: planning.completedOnTime + planning.completedLate,
    focusMinutes,
    habitConsistencyPercent,
    activeKpis: kpis.length,
  };

  return {
    range,
    generatedAt: new Date().toISOString(),
    sections,
    summary: want.has("summary") ? summary : null,
    goals: want.has("goals") ? goalsSection : null,
    habits: want.has("habits") ? habitsSection : null,
    focus: want.has("focus") ? focusSection : null,
    kpis: want.has("kpis") ? kpiRows : null,
    planning: want.has("planning") ? planning : null,
  };
}
