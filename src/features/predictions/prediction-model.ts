import type { Goal } from "@/features/goals/schema";
import type { Task } from "@/features/tasks/schema";
import type { TimeBlock } from "@/features/time-blocking/schema";
import { isClosed } from "@/features/tasks/schema";

/**
 * Deterministic predictive signals. Every function here answers "what does the
 * user's own recorded data imply may happen?" with an explicit, listable
 * rationale — no ML, no fabricated numbers, no diagnosis. Language is
 * probabilistic ("may", "appears", "based on"); a prediction is never stated as
 * a fact.
 *
 * Pure module — no React, no I/O. Covered by prediction-model.test.ts.
 */

export type PredictionCategory =
  | "goal-trajectory"
  | "deadline-risk"
  | "schedule-overload"
  | "goal-inactivity"
  | "habit-trajectory";

/** Ranking tiers — controls prominence and guards against alert fatigue. */
export type PredictionUrgency = "critical" | "important" | "opportunity" | "information";

/** Qualitative — never a fabricated percentage. */
export type PredictionConfidence = "high" | "moderate" | "limited";

export const CONFIDENCE_LABEL: Record<PredictionConfidence, string> = {
  high: "High confidence",
  moderate: "Moderate confidence",
  limited: "Limited data",
};

export const URGENCY_LABEL: Record<PredictionUrgency, string> = {
  critical: "Needs attention",
  important: "Worth reviewing",
  opportunity: "Opportunity",
  information: "For information",
};

export interface PredictiveSignal {
  id: string;
  category: PredictionCategory;
  urgency: PredictionUrgency;
  /** The hedged forward-looking statement. */
  prediction: string;
  /** Concise current facts behind it — shown under "Why?". */
  evidence: string[];
  confidence: PredictionConfidence;
  timeWindow?: string;
  /** What the user could consider — never imperative, never auto-applied. */
  recommendation?: string;
  action?: { label: string; href: string };
  generatedAt: string;
}

const DAY_MS = 86_400_000;

function daysBetween(fromIso: string, toIso: string): number | null {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.round((to - from) / DAY_MS);
}

/**
 * Sample-size → confidence. Bands match Layer 11's sufficiency thresholds
 * (documented there): < 4 comparable data points is "limited", 4-29 "moderate",
 * 30+ "high". Applied to comparable planning days / logged habit days, not to a
 * statistical model.
 */
export function confidenceFromSample(sampleSize: number): PredictionConfidence {
  if (sampleSize >= 30) return "high";
  if (sampleSize >= 4) return "moderate";
  return "limited";
}

// ── Goal trajectory ────────────────────────────────────────────────────────

export type GoalTrajectory = "ahead" | "on-track" | "at-risk" | "insufficient";

export interface GoalTrajectoryResult {
  trajectory: GoalTrajectory;
  /** Where the goal "should" be if progress were linear across its date range. */
  expectedProgress: number | null;
  daysRemaining: number | null;
}

/**
 * Compare recorded `progress` against where a linear pace would put it between
 * `startDate` and `targetDate`. ±10 points of the pace line is "on-track". No
 * dates, or a zero-length range → "insufficient" (never a manufactured number).
 */
export function assessGoalTrajectory(goal: Goal, nowIso: string): GoalTrajectoryResult {
  if (!goal.startDate || !goal.targetDate) {
    return { trajectory: "insufficient", expectedProgress: null, daysRemaining: null };
  }
  const total = daysBetween(goal.startDate, goal.targetDate);
  const elapsed = daysBetween(goal.startDate, nowIso);
  const daysRemaining = daysBetween(nowIso, goal.targetDate);
  if (total === null || elapsed === null || total <= 0) {
    return { trajectory: "insufficient", expectedProgress: null, daysRemaining };
  }

  const expectedProgress = Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
  const delta = goal.progress - expectedProgress;
  const trajectory: GoalTrajectory =
    delta >= 10 ? "ahead" : delta >= -10 ? "on-track" : "at-risk";

  return { trajectory, expectedProgress, daysRemaining };
}

// ── Signal builders ────────────────────────────────────────────────────────

const OPEN_GOAL_STATUSES = new Set(["in-progress", "not-started"]);

function goalTrajectorySignal(goal: Goal, nowIso: string): PredictiveSignal | null {
  const result = assessGoalTrajectory(goal, nowIso);
  if (result.trajectory === "insufficient" || result.expectedProgress === null) return null;
  // "on-track" and "ahead" are reassurance, not alerts — only surface at-risk here.
  if (result.trajectory !== "at-risk") return null;

  return {
    id: `goal-trajectory-${goal.id}`,
    category: "goal-trajectory",
    urgency: (result.daysRemaining ?? 99) <= 7 ? "important" : "opportunity",
    prediction: `"${goal.title}" appears to be behind pace and may not reach its target by ${goal.targetDate}.`,
    evidence: [
      `Recorded progress: ${goal.progress}%`,
      `A linear pace would be near ${result.expectedProgress}% by today`,
      result.daysRemaining !== null ? `${result.daysRemaining} days until the target date` : "Target date set",
    ],
    confidence: "moderate",
    timeWindow: `by ${goal.targetDate}`,
    recommendation: "Consider reviewing the plan for this goal or adjusting its target date.",
    action: { label: "Review goal", href: "/plan/goals" },
    generatedAt: nowIso,
  };
}

function deadlineRiskSignal(
  goal: Goal,
  linkedTasks: Task[],
  nowIso: string,
): PredictiveSignal | null {
  if (!goal.targetDate || !OPEN_GOAL_STATUSES.has(goal.goalStatus)) return null;
  const daysRemaining = daysBetween(nowIso, goal.targetDate);
  if (daysRemaining === null || daysRemaining < 0 || daysRemaining > 14) return null;
  if (goal.progress >= 80) return null;

  const openTasks = linkedTasks.filter((task) => !isClosed(task.taskStatus));
  const remainingMinutes = openTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);

  const evidence = [
    `Deadline in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`,
    `Recorded progress: ${goal.progress}%`,
  ];
  if (openTasks.length > 0) {
    evidence.push(`${openTasks.length} linked task${openTasks.length === 1 ? "" : "s"} still open`);
    if (remainingMinutes > 0) {
      evidence.push(`~${Math.round(remainingMinutes / 60)}h of estimated work remaining`);
    }
  }

  return {
    id: `deadline-risk-${goal.id}`,
    category: "deadline-risk",
    urgency: daysRemaining <= 3 ? "critical" : "important",
    prediction: `"${goal.title}" may need additional time before ${goal.targetDate}.`,
    evidence,
    confidence: "moderate",
    timeWindow: `next ${daysRemaining} days`,
    recommendation: "Consider protecting focus time for it, or moving the target date.",
    action: { label: "Review plan", href: "/plan/goals" },
    generatedAt: nowIso,
  };
}

/** Minutes of planned time-block work on a given local date. */
export function plannedMinutesForDate(blocks: TimeBlock[], dateIso: string): number {
  let total = 0;
  for (const block of blocks) {
    if (block.startDateTime.slice(0, 10) !== dateIso) continue;
    const start = Date.parse(block.startDateTime);
    const end = Date.parse(block.endDateTime);
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) continue;
    total += Math.round((end - start) / 60_000);
  }
  return total;
}

/**
 * A day whose planned time-block minutes exceed the given focus capacity. The
 * capacity default (300 min / 5h) is a conservative planning assumption, not a
 * measured limit — it is a parameter so callers can pass a real figure later.
 */
function scheduleOverloadSignal(
  blocks: TimeBlock[],
  dateIso: string,
  capacityMinutes: number,
  nowIso: string,
): PredictiveSignal | null {
  const planned = plannedMinutesForDate(blocks, dateIso);
  if (planned <= capacityMinutes) return null;

  const hrs = (n: number) => `${Math.floor(n / 60)}h ${n % 60}m`;
  return {
    id: `schedule-overload-${dateIso}`,
    category: "schedule-overload",
    urgency: "important",
    prediction: `${dateIso} appears overloaded — planned blocks exceed a typical focus capacity.`,
    evidence: [`Planned: ${hrs(planned)}`, `Assumed focus capacity: ${hrs(capacityMinutes)}`],
    confidence: "limited",
    timeWindow: dateIso,
    recommendation: "Consider moving one block to a lighter day. Mastery will not move it for you.",
    action: { label: "Review schedule", href: "/focus/time-blocking" },
    generatedAt: nowIso,
  };
}

function goalInactivitySignal(
  goal: Goal,
  nowIso: string,
  thresholdDays: number,
): PredictiveSignal | null {
  if (!OPEN_GOAL_STATUSES.has(goal.goalStatus)) return null;
  if (goal.priority !== "high" && goal.priority !== "critical") return null;
  const idleDays = daysBetween(goal.updatedAt, nowIso);
  if (idleDays === null || idleDays < thresholdDays) return null;

  return {
    id: `goal-inactivity-${goal.id}`,
    category: "goal-inactivity",
    urgency: "important",
    prediction: `"${goal.title}" has had no recorded activity for ${idleDays} days and may be stalling.`,
    evidence: [
      `Priority: ${goal.priority}`,
      `Last updated ${idleDays} days ago`,
      `Recorded progress: ${goal.progress}%`,
    ],
    confidence: "moderate",
    recommendation: "Consider scheduling the next concrete step, or reprioritising the goal.",
    action: { label: "Open goal", href: "/plan/goals" },
    generatedAt: nowIso,
  };
}

// ── Habit trajectory ───────────────────────────────────────────────────────

export type HabitTrajectory =
  | "stable"
  | "improving"
  | "declining"
  | "inconsistent"
  | "insufficient";

export interface HabitDay {
  state: "completed" | "missed" | "not-expected";
}

/**
 * Classify a habit's recent expected days (ignoring "not-expected"). Needs at
 * least 4 expected days. Compares the first and second halves of the window: a
 * ≥25-point swing is improving/declining, a completion rate between 34% and 66%
 * over a stable window is "inconsistent", otherwise "stable".
 */
export function assessHabitTrajectory(days: HabitDay[]): HabitTrajectory {
  const expected = days.filter((day) => day.state !== "not-expected");
  if (expected.length < 4) return "insufficient";

  const rate = (subset: HabitDay[]) =>
    subset.length === 0
      ? 0
      : subset.filter((day) => day.state === "completed").length / subset.length;

  const mid = Math.floor(expected.length / 2);
  const firstRate = rate(expected.slice(0, mid));
  const secondRate = rate(expected.slice(mid));
  const overall = rate(expected);
  const swing = secondRate - firstRate;

  if (swing >= 0.25) return "improving";
  if (swing <= -0.25) return "declining";
  if (overall > 0.34 && overall < 0.66) return "inconsistent";
  return "stable";
}

function habitTrajectorySignal(
  habitId: string,
  habitTitle: string,
  days: HabitDay[],
  nowIso: string,
): PredictiveSignal | null {
  const trajectory = assessHabitTrajectory(days);
  if (trajectory === "insufficient" || trajectory === "stable" || trajectory === "improving") {
    return null;
  }

  const expected = days.filter((day) => day.state !== "not-expected");
  const completed = expected.filter((day) => day.state === "completed").length;

  return {
    id: `habit-trajectory-${habitId}`,
    category: "habit-trajectory",
    urgency: "opportunity",
    prediction:
      trajectory === "declining"
        ? `"${habitTitle}" consistency appears to be decreasing.`
        : `"${habitTitle}" completion has been inconsistent recently.`,
    evidence: [
      `Recent completion: ${completed} / ${expected.length} expected days`,
      "Based on your logged habit days only",
    ],
    confidence: confidenceFromSample(expected.length),
    recommendation: "Consider a smaller, fixed daily slot for it, or pausing it deliberately.",
    action: { label: "Open habits", href: "/act/habits" },
    generatedAt: nowIso,
  };
}

// ── Assembly ───────────────────────────────────────────────────────────────

const URGENCY_RANK: Record<PredictionUrgency, number> = {
  critical: 0,
  important: 1,
  opportunity: 2,
  information: 3,
};

export interface PredictionInputs {
  goals: Goal[];
  /** All open+closed tasks; linked to goals via `goalId`. */
  tasks: Task[];
  blocks: TimeBlock[];
  /** Recent day-state windows per habit, keyed by habit id, with the title. */
  habitWindows: { id: string; title: string; days: HabitDay[] }[];
  nowIso: string;
  /** Minutes of focus capacity assumed per day (default 300 = 5h). */
  focusCapacityMinutes?: number;
  /** Days of goal silence before an inactivity signal (default 5). */
  inactivityThresholdDays?: number;
}

/**
 * Build every predictive signal the data currently supports, ranked by urgency
 * then confidence. Non-alerting states (on-track goals, stable habits) produce
 * nothing — the list stays short by construction.
 */
export function buildPredictions(inputs: PredictionInputs): PredictiveSignal[] {
  const {
    goals,
    tasks,
    blocks,
    habitWindows,
    nowIso,
    focusCapacityMinutes = 300,
    inactivityThresholdDays = 5,
  } = inputs;

  const tasksByGoal = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.goalId) continue;
    tasksByGoal.set(task.goalId, [...(tasksByGoal.get(task.goalId) ?? []), task]);
  }

  const signals: PredictiveSignal[] = [];

  for (const goal of goals) {
    if (goal.goalStatus === "achieved" || goal.goalStatus === "dropped") continue;
    const deadline = deadlineRiskSignal(goal, tasksByGoal.get(goal.id) ?? [], nowIso);
    if (deadline) signals.push(deadline);
    else {
      const trajectory = goalTrajectorySignal(goal, nowIso);
      if (trajectory) signals.push(trajectory);
    }
    const inactivity = goalInactivitySignal(goal, nowIso, inactivityThresholdDays);
    if (inactivity) signals.push(inactivity);
  }

  // Look at the next 7 local days for overload.
  for (let offset = 0; offset < 7; offset += 1) {
    const dateIso = new Date(Date.parse(nowIso) + offset * DAY_MS).toISOString().slice(0, 10);
    const overload = scheduleOverloadSignal(blocks, dateIso, focusCapacityMinutes, nowIso);
    if (overload) signals.push(overload);
  }

  for (const window of habitWindows) {
    const signal = habitTrajectorySignal(window.id, window.title, window.days, nowIso);
    if (signal) signals.push(signal);
  }

  return rankPredictions(signals);
}

export function rankPredictions(signals: PredictiveSignal[], limit?: number): PredictiveSignal[] {
  const confidenceRank: Record<PredictionConfidence, number> = { high: 0, moderate: 1, limited: 2 };
  const ranked = [...signals].sort((a, b) => {
    const byUrgency = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
    if (byUrgency !== 0) return byUrgency;
    return confidenceRank[a.confidence] - confidenceRank[b.confidence];
  });
  return typeof limit === "number" ? ranked.slice(0, limit) : ranked;
}

/** Group signals into the predictive-dashboard buckets (STEP 20). */
export function groupPredictions(signals: PredictiveSignal[]) {
  return {
    watch: signals.filter(
      (s) => s.urgency === "critical" || s.urgency === "important",
    ),
    opportunities: signals.filter((s) => s.urgency === "opportunity"),
    information: signals.filter((s) => s.urgency === "information"),
  };
}
