import type { InsightSignal } from "@/components/mastery/AIInsightCard";
import {
  isImprovement,
  type MetricSummary,
  type PeriodComparison,
} from "@/features/analytics/analytics-insights";
import type { BrainModuleId } from "@/features/brain-hub";
import type { DeepWorkSession } from "@/features/deep-work/schema";
import type { Goal } from "@/features/goals/schema";
import type { JournalEntry } from "@/features/journal/schema";
import type { LearningItem } from "@/features/learning/schema";
import type { Plan } from "@/features/plans/schema";
import type { Task } from "@/features/tasks/schema";

export type InsightType =
  | "PROGRESS"
  | "PATTERN"
  | "ATTENTION"
  | "RECOMMENDATION"
  | "SUMMARY"
  | "ALIGNMENT";

export type InsightSeverity = "critical" | "high" | "medium" | "low" | "info";
export type InsightConfidence = "high" | "medium" | "low";
export type InsightStatus = "active" | "dismissed";

export interface InsightAction {
  label: string;
  href: string;
}

export interface MasteryInsight {
  id: string;
  type: InsightType;
  title: string;
  summary: string;
  detail: string;
  recommendation: string;
  severity: InsightSeverity;
  confidence: InsightConfidence;
  signal: InsightSignal;
  source: string[];
  relatedModule: BrainModuleId | "global";
  relatedEntity?: { type: string; id: string };
  createdAt: string;
  actions: InsightAction[];
  status: InsightStatus;
  evidence: string[];
}

export interface IntelligenceInput {
  metrics: MetricSummary[];
  lifeScore: PeriodComparison;
  periodLabel: string;
  hasAnyData: boolean;
  goals: Goal[];
  plans: Plan[];
  tasks: Task[];
  deepWorkSessions: DeepWorkSession[];
  journalEntries: JournalEntry[];
  learningItems: LearningItem[];
  nowIsoDate?: string;
}

export interface IntelligenceOutput {
  insights: MasteryInsight[];
  today: MasteryInsight[];
  progress: MasteryInsight[];
  attention: MasteryInsight[];
  patterns: MasteryInsight[];
  recommendations: MasteryInsight[];
  moduleAttention: Record<BrainModuleId, { count: number; topSeverity: InsightSeverity | null }>;
}

const MODULES: BrainModuleId[] = ["goals", "plan", "focus", "act", "grow", "analytics"];

const SEVERITY_RANK: Record<InsightSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const CONFIDENCE_RANK: Record<InsightConfidence, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function todayIso(input?: string): string {
  return input ?? new Date().toISOString().slice(0, 10);
}

function signalFromConfidence(confidence: InsightConfidence): InsightSignal {
  if (confidence === "high") return "strong";
  if (confidence === "medium") return "moderate";
  return "limited";
}

function confidenceFromSamples(samples: number): InsightConfidence {
  if (samples >= 8) return "high";
  if (samples >= 4) return "medium";
  return "low";
}

function isOpenGoal(goal: Goal): boolean {
  return goal.goalStatus !== "achieved" && goal.goalStatus !== "dropped";
}

function isOpenTask(task: Task): boolean {
  return task.taskStatus !== "done" && task.taskStatus !== "cancelled";
}

function createInsight(
  partial: Omit<MasteryInsight, "createdAt" | "status" | "signal"> &
    Partial<Pick<MasteryInsight, "createdAt" | "status" | "signal">>,
): MasteryInsight {
  return {
    createdAt: new Date().toISOString(),
    status: "active",
    signal: signalFromConfidence(partial.confidence),
    ...partial,
  };
}

function metricInsights(input: IntelligenceInput): MasteryInsight[] {
  const meaningful: MasteryInsight[] = [];
  for (const metric of input.metrics) {
    const { comparison } = metric;
    if (comparison.changePct === null || comparison.sampleSize < 3) continue;
    if (Math.abs(comparison.changePct) < 5) continue;
    const improving = isImprovement(metric);
    if (improving === null) continue;
    meaningful.push(
      createInsight({
        id: `metric-${metric.id}`,
        type: "PROGRESS",
        title: improving ? `${metric.label} is improving` : `${metric.label} needs attention`,
        summary: `${metric.label} changed ${comparison.changePct > 0 ? "+" : ""}${comparison.changePct}% over the ${input.periodLabel}.`,
        detail: `${comparison.previous ?? "—"}${metric.unit ? ` ${metric.unit}` : ""} -> ${comparison.current ?? "—"}${metric.unit ? ` ${metric.unit}` : ""} across ${comparison.sampleSize} entries.`,
        recommendation: improving
          ? "Keep the routine that supports this measure."
          : "Review the linked KPI trend and schedule time to correct course.",
        severity: improving ? "low" : "high",
        confidence: confidenceFromSamples(comparison.sampleSize),
        source: ["kpis"],
        relatedModule: "analytics",
        relatedEntity: { type: "kpi", id: metric.id },
        actions: [{ label: "Open KPIs", href: "/analytics/kpis" }],
        evidence: [
          `${comparison.sampleSize} entries in this period`,
          `Previous: ${comparison.previous ?? "not available"}`,
          `Current: ${comparison.current ?? "not available"}`,
        ],
      }),
    );
  }
  return meaningful;
}

function lifeScoreInsight(input: IntelligenceInput): MasteryInsight[] {
  if (input.lifeScore.changeAbs === null || Math.abs(input.lifeScore.changeAbs) < 3) return [];
  const up = input.lifeScore.changeAbs > 0;
  return [
    createInsight({
      id: "life-score",
      type: "SUMMARY",
      title: up ? "Life Score trend is positive" : "Life Score trend is negative",
      summary: `Life Score moved ${input.lifeScore.changeAbs > 0 ? "+" : ""}${input.lifeScore.changeAbs} over the ${input.periodLabel}.`,
      detail: `${input.lifeScore.previous ?? "—"} -> ${input.lifeScore.current ?? "—"}.`,
      recommendation: up
        ? "Keep the current execution rhythm while it remains stable."
        : "Review KPI contributors to find the primary drag on the score.",
      severity: up ? "low" : "high",
      confidence: confidenceFromSamples(input.lifeScore.sampleSize),
      source: ["life-score"],
      relatedModule: "analytics",
      actions: [{ label: "Open Life Score", href: "/analytics/life-score" }],
      evidence: [
        `${input.lifeScore.sampleSize} saved scores in this period`,
        `Previous: ${input.lifeScore.previous ?? "not available"}`,
        `Current: ${input.lifeScore.current ?? "not available"}`,
      ],
    }),
  ];
}

function taskAttentionInsight(input: IntelligenceInput, today: string): MasteryInsight[] {
  const openTasks = input.tasks.filter(isOpenTask);
  const overdue = openTasks.filter((task) => task.dueDate != null && task.dueDate < today);
  const blocked = openTasks.filter((task) => task.taskStatus === "blocked");
  if (overdue.length === 0 && blocked.length === 0) return [];

  return [
    createInsight({
      id: "act-overdue-blocked",
      type: "ATTENTION",
      title: "Execution backlog needs review",
      summary: `${overdue.length} overdue and ${blocked.length} blocked tasks are active.`,
      detail: `${openTasks.length} open tasks total in Act.`,
      recommendation: "Review overdue and blocked tasks before adding new commitments.",
      severity: overdue.length > 0 ? "critical" : "high",
      confidence: confidenceFromSamples(openTasks.length),
      source: ["tasks"],
      relatedModule: "act",
      actions: [{ label: "Open Tasks", href: "/act/tasks" }],
      evidence: [
        `${openTasks.length} open tasks`,
        `${overdue.length} overdue`,
        `${blocked.length} blocked`,
      ],
    }),
  ];
}

function goalPlanAlignmentInsights(input: IntelligenceInput): MasteryInsight[] {
  const openGoals = input.goals.filter(isOpenGoal);
  if (openGoals.length === 0) return [];

  const planIds = new Set(input.plans.map((plan) => plan.id));
  const tasksByGoal = new Map<string, number>();
  for (const task of input.tasks) {
    if (!task.goalId || !isOpenTask(task)) continue;
    tasksByGoal.set(task.goalId, (tasksByGoal.get(task.goalId) ?? 0) + 1);
  }

  const unsupported = openGoals.filter((goal) => {
    const hasPlan = goal.parentPlanId ? planIds.has(goal.parentPlanId) : false;
    const taskCount = tasksByGoal.get(goal.id) ?? 0;
    return !hasPlan && taskCount === 0;
  });

  const aligned = openGoals.filter((goal) => {
    const hasPlan = goal.parentPlanId ? planIds.has(goal.parentPlanId) : false;
    return hasPlan || (tasksByGoal.get(goal.id) ?? 0) > 0;
  });

  const insights: MasteryInsight[] = [];
  if (unsupported.length > 0) {
    insights.push(
      createInsight({
        id: "goals-no-support",
        type: "ALIGNMENT",
        title: "Some goals have no active plan support",
        summary: `${unsupported.length} open goals currently have no linked plan or open task support.`,
        detail: `${aligned.length} goals are currently supported.`,
        recommendation: "Connect unsupported goals to an active plan or at least one next action.",
        severity: unsupported.length >= 3 ? "high" : "medium",
        confidence: confidenceFromSamples(openGoals.length),
        source: ["goals", "plans", "tasks"],
        relatedModule: "goals",
        actions: [{ label: "Open Goals", href: "/plan/goals" }],
        evidence: [
          `${openGoals.length} open goals`,
          `${unsupported.length} unsupported`,
          `${aligned.length} aligned or partially aligned`,
        ],
      }),
    );
  }

  if (aligned.length > 0) {
    insights.push(
      createInsight({
        id: "goals-aligned",
        type: "PROGRESS",
        title: "Goal-plan alignment is present",
        summary: `${aligned.length} open goals have either active plan linkage or task support.`,
        detail: `${unsupported.length} goals still need support linkage.`,
        recommendation:
          unsupported.length > 0
            ? "Maintain aligned goals and close support gaps on the remaining ones."
            : "Maintain this linkage by adding next actions when plans change.",
        severity: unsupported.length > 0 ? "low" : "info",
        confidence: confidenceFromSamples(openGoals.length),
        source: ["goals", "plans", "tasks"],
        relatedModule: "plan",
        actions: [{ label: "Open Planning Cascade", href: "/plan/cascade" }],
        evidence: [`${aligned.length}/${openGoals.length} open goals currently supported`],
      }),
    );
  }

  return insights;
}

function focusPatternInsights(input: IntelligenceInput): MasteryInsight[] {
  const completed = input.deepWorkSessions.filter((session) => session.sessionStatus === "completed");
  if (completed.length < 5) return [];

  const morning = completed.filter((session) => {
    if (!session.startedAt) return false;
    return new Date(session.startedAt).getHours() < 11;
  }).length;

  const ratio = morning / completed.length;
  if (ratio >= 0.6) {
    return [
      createInsight({
        id: "focus-morning-pattern",
        type: "PATTERN",
        title: "Focus sessions are strongest earlier in the day",
        summary: `${morning}/${completed.length} completed deep-work sessions started before 11:00.`,
        detail: "This is a historical pattern from completed sessions, not a fixed rule.",
        recommendation: "Protect one morning block for your highest-value focus task.",
        severity: "low",
        confidence: confidenceFromSamples(completed.length),
        source: ["focusSessions"],
        relatedModule: "focus",
        actions: [{ label: "Open Deep Work", href: "/focus/deep-work" }],
        evidence: [
          `${completed.length} completed sessions reviewed`,
          `${Math.round(ratio * 100)}% start before 11:00`,
        ],
      }),
    ];
  }

  return [];
}

function growConsistencyInsight(input: IntelligenceInput, today: string): MasteryInsight[] {
  const recentJournal = input.journalEntries.filter((entry) => {
    const age = (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${entry.entryDate}T00:00:00Z`)) / 86400000;
    return age >= 0 && age < 7;
  }).length;

  const inProgressLearning = input.learningItems.filter(
    (item) => item.learningStatus === "in-progress",
  ).length;

  if (recentJournal === 0 && inProgressLearning === 0) return [];

  return [
    createInsight({
      id: "grow-consistency",
      type: "SUMMARY",
      title: "Growth activity is present this week",
      summary: `${recentJournal} journal entries in the last 7 days and ${inProgressLearning} learning items currently in progress.`,
      detail: "Growth consistency is based on observed journaling and active learning records.",
      recommendation: "Keep a weekly reflection and one active learning thread to sustain momentum.",
      severity: "info",
      confidence: confidenceFromSamples(recentJournal + inProgressLearning),
      source: ["journalEntries", "learningItems"],
      relatedModule: "grow",
      actions: [{ label: "Open Grow", href: "/grow" }],
      evidence: [`${recentJournal} recent reflections`, `${inProgressLearning} active learning tracks`],
    }),
  ];
}

function recommendationInsights(insights: MasteryInsight[]): MasteryInsight[] {
  const highAttention = insights.find((insight) => insight.type === "ATTENTION");
  if (!highAttention) return [];
  return [
    createInsight({
      id: "next-best-review",
      type: "RECOMMENDATION",
      title: "Start with one high-impact review",
      summary: "A single focused review is likely to improve current system clarity.",
      detail: `Top attention item: ${highAttention.title}.`,
      recommendation: "Address the highest-severity attention item before creating new work.",
      severity: "medium",
      confidence: highAttention.confidence,
      source: ["intelligence-engine"],
      relatedModule: highAttention.relatedModule,
      actions: highAttention.actions,
      evidence: [`Derived from highest-ranked attention signal: ${highAttention.id}`],
    }),
  ];
}

function rankInsights(a: MasteryInsight, b: MasteryInsight): number {
  const severity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
  if (severity !== 0) return severity;
  const confidence = CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence];
  if (confidence !== 0) return confidence;
  return a.title.localeCompare(b.title);
}

function sectionByType(insights: MasteryInsight[]) {
  return {
    today: insights.slice(0, 3),
    progress: insights.filter((insight) => insight.type === "PROGRESS" || insight.type === "SUMMARY"),
    attention: insights.filter((insight) => insight.type === "ATTENTION" || insight.severity === "critical" || insight.severity === "high"),
    patterns: insights.filter((insight) => insight.type === "PATTERN"),
    recommendations: insights.filter((insight) => insight.type === "RECOMMENDATION"),
  };
}

function buildModuleAttention(insights: MasteryInsight[]): IntelligenceOutput["moduleAttention"] {
  const state = MODULES.reduce(
    (acc, moduleId) => {
      acc[moduleId] = { count: 0, topSeverity: null };
      return acc;
    },
    {} as IntelligenceOutput["moduleAttention"],
  );

  for (const insight of insights) {
    if (insight.relatedModule === "global") continue;
    if (insight.type !== "ATTENTION" && insight.type !== "RECOMMENDATION") continue;
    const slot = state[insight.relatedModule];
    slot.count += 1;
    if (!slot.topSeverity) {
      slot.topSeverity = insight.severity;
    } else if (SEVERITY_RANK[insight.severity] < SEVERITY_RANK[slot.topSeverity]) {
      slot.topSeverity = insight.severity;
    }
  }

  return state;
}

export function buildIntelligence(input: IntelligenceInput): IntelligenceOutput {
  if (!input.hasAnyData) {
    const empty = sectionByType([]);
    return {
      insights: [],
      ...empty,
      moduleAttention: buildModuleAttention([]),
    };
  }

  const today = todayIso(input.nowIsoDate);
  const base = [
    ...metricInsights(input),
    ...lifeScoreInsight(input),
    ...taskAttentionInsight(input, today),
    ...goalPlanAlignmentInsights(input),
    ...focusPatternInsights(input),
    ...growConsistencyInsight(input, today),
  ];

  const enriched = [...base, ...recommendationInsights(base)].sort(rankInsights).slice(0, 10);
  const sections = sectionByType(enriched);

  return {
    insights: enriched,
    ...sections,
    moduleAttention: buildModuleAttention(enriched),
  };
}
