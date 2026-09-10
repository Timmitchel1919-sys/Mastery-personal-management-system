import type { BrainSystemState } from "@/features/brain-hub/brain-state";
import type { DecisionRecord, DecisionStatus } from "@/features/decisions/schema";
import type { Goal } from "@/features/goals/schema";
import type { MasteryInsight } from "@/features/intelligence/mastery-intelligence";
import type { Plan } from "@/features/plans/schema";
import type { PredictiveSignal } from "@/features/predictions/prediction-model";

/**
 * Layer O — Adaptive Personal Strategy Engine.
 *
 * A pure, deterministic analysis over state the earlier layers already derive
 * (goals, plans, intelligence, predictions, decisions, brain-system-state). It is
 * strictly advisory: it identifies alignment, drift, goal health, bottlenecks,
 * opportunities, trade-offs, strategic debt and scenarios, and it structures
 * recommendations for the user to REVIEW / APPLY / MODIFY / DISMISS. It never
 * changes a goal, deletes a plan, re-prioritises an objective, or executes
 * anything. Where the data is thin it says so rather than guessing.
 */

const DAY_MS = 86_400_000;

export type StrategyConfidence = "high" | "medium" | "low" | "insufficient-data";
export type StrategyUserAction = "REVIEW" | "APPLY" | "MODIFY" | "DISMISS";

export type GoalAlignmentLevel = "aligned" | "weak" | "unclear";
export type GoalHealthState =
  | "on-track"
  | "at-risk"
  | "stalled"
  | "inactive"
  | "insufficient-data";

export type BottleneckType =
  | "TIME"
  | "CAPACITY"
  | "DEPENDENCY"
  | "MISSING_INFORMATION"
  | "DECISION"
  | "RESOURCE"
  | "EXECUTION";

export type ScenarioKind =
  | "current-course"
  | "accelerate"
  | "defer"
  | "reduce"
  | "restructure";

export type ScenarioHorizon = "short" | "medium" | "long" | "limited-data";

export type ChangeKind = "NEW" | "CHANGED" | "IMPROVED" | "DECLINED" | "RESOLVED";

export type ReviewKind = "weekly" | "monthly" | "quarterly";

export interface StrategicContext {
  activeGoals: number;
  strategicObjectives: number;
  activePlans: number;
  majorProjects: number;
  currentPriorities: string[];
  executionState: "active" | "light" | "attention" | "unknown";
  progressState: number | null;
  riskState: number;
  decisionState: number;
  learningSignals: number;
  capacityConstrained: boolean;
  recentChanges: number;
}

export interface GoalAlignment {
  goalId: string;
  goalTitle: string;
  priority: Goal["priority"];
  level: GoalAlignmentLevel;
  evidence: string[];
}

export interface DriftSignal {
  id: string;
  type: string;
  statement: string;
  evidence: string[];
}

export interface GoalHealth {
  goalId: string;
  goalTitle: string;
  state: GoalHealthState;
  reasons: string[];
}

export interface Bottleneck {
  id: string;
  type: BottleneckType;
  statement: string;
  relatedGoal: string | null;
  evidence: string[];
}

export interface Opportunity {
  id: string;
  observation: string;
  evidence: string[];
  potentialBenefit: string;
  assumptions: string[];
}

export interface TradeOff {
  id: string;
  optionA: string;
  optionB: string;
  tradeOff: string;
  potentialConsequence: string;
}

export interface Scenario {
  kind: ScenarioKind;
  title: string;
  description: string;
  implications: string[];
  horizon: ScenarioHorizon;
}

export interface StrategicDebtItem {
  id: string;
  item: string;
  ageDays: number;
  impact: "low" | "medium" | "high";
  source: string;
  recommendedReview: string;
}

export interface ChangeItem {
  id: string;
  kind: ChangeKind;
  area: string;
  statement: string;
}

export interface AllocationRow {
  area: "TIME" | "FOCUS" | "CAPACITY" | "ATTENTION";
  statement: string;
  evidence: string[];
}

export interface PortfolioItem {
  id: string;
  name: string;
  kind: "goal" | "plan";
  status: "ACTIVE" | "PLANNED" | "AT_RISK" | "BLOCKED" | "COMPLETED";
  goalAlignment: string;
  priority: string;
  risk: "low" | "medium" | "high";
  progress: number | null;
}

export interface StrategyRecommendation {
  id: string;
  title: string;
  observation: string;
  evidence: string[];
  option: string;
  expectedBenefit: string;
  potentialDownside: string;
  confidence: StrategyConfidence;
  userAction: StrategyUserAction;
}

export interface StrategyState {
  generatedAt: string;
  context: StrategicContext;
  alignment: GoalAlignment[];
  drift: DriftSignal[];
  goalHealth: GoalHealth[];
  bottlenecks: Bottleneck[];
  opportunities: Opportunity[];
  tradeOffs: TradeOff[];
  scenarios: Scenario[];
  strategicDebt: StrategicDebtItem[];
  changes: ChangeItem[];
  allocation: AllocationRow[];
  portfolio: PortfolioItem[];
  recommendations: StrategyRecommendation[];
  degraded: string[];
}

export interface StrategyIntelligenceProjection {
  status: "loading" | "ready" | "error";
  attention: MasteryInsight[];
  patterns: MasteryInsight[];
  recommendations: MasteryInsight[];
  today: MasteryInsight[];
}

export interface StrategyPredictionProjection {
  status: "loading" | "ready" | "error";
  enabled: boolean;
  signals: PredictiveSignal[];
}

export interface StrategyInput {
  nowIso?: string;
  goals: Goal[];
  plans: Plan[];
  intelligence: StrategyIntelligenceProjection | null;
  predictions: StrategyPredictionProjection | null;
  decisions: DecisionRecord[] | null;
  brain: BrainSystemState | null;
}

const HIGH_PRIORITY = new Set<Goal["priority"]>(["high", "critical"]);
const OPEN_DECISION_STATUSES = new Set<DecisionStatus>(["DRAFT", "ANALYZING", "READY"]);
const STALE_GOAL_DAYS = 28;
const DEBT_GOAL_DAYS = 42;

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / DAY_MS);
}

function activeGoals(goals: Goal[]): Goal[] {
  return goals.filter(
    (goal) => goal.goalStatus === "in-progress" || goal.goalStatus === "not-started",
  );
}

function planFor(goal: Goal, plans: Plan[]): Plan | null {
  if (!goal.parentPlanId) return null;
  return plans.find((plan) => plan.id === goal.parentPlanId) ?? null;
}

function goalsAttentionInsights(intel: StrategyInput["intelligence"]): MasteryInsight[] {
  if (!intel) return [];
  return intel.attention.filter(
    (insight) =>
      insight.relatedModule === "goals" &&
      (insight.severity === "critical" || insight.severity === "high"),
  );
}

function scheduleOverload(predictions: StrategyInput["predictions"]): PredictiveSignal | null {
  if (!predictions || !predictions.enabled) return null;
  return predictions.signals.find((signal) => signal.category === "schedule-overload") ?? null;
}

function deadlineSignals(predictions: StrategyInput["predictions"]): PredictiveSignal[] {
  if (!predictions || !predictions.enabled) return [];
  return predictions.signals.filter((signal) => signal.category === "deadline-risk");
}

function buildContext(input: StrategyInput, derived: {
  drift: DriftSignal[];
  changes: ChangeItem[];
}): StrategicContext {
  const active = activeGoals(input.goals);
  const progresses = active.map((goal) => goal.progress);
  const executionState = ((): StrategicContext["executionState"] => {
    if (!input.brain || input.brain.availability !== "ready") return "unknown";
    const act = input.brain.modules.act;
    if (act.status === "attention") return "attention";
    if (act.status === "active" || act.status === "progress") return "active";
    return "light";
  })();

  return {
    activeGoals: active.length,
    strategicObjectives: active.filter((goal) => HIGH_PRIORITY.has(goal.priority)).length,
    activePlans: input.plans.filter((plan) => plan.planStatus === "active").length,
    majorProjects: input.plans.filter(
      (plan) => plan.horizon === "quarter" || plan.horizon === "one-year" || plan.horizon === "five-year",
    ).length,
    currentPriorities: (input.intelligence?.today ?? []).slice(0, 3).map((insight) => insight.title),
    executionState,
    progressState:
      progresses.length === 0
        ? null
        : Math.round(progresses.reduce((sum, value) => sum + value, 0) / progresses.length),
    riskState: deadlineSignals(input.predictions).length + (scheduleOverload(input.predictions) ? 1 : 0),
    decisionState: (input.decisions ?? []).filter((decision) =>
      OPEN_DECISION_STATUSES.has(decision.status),
    ).length,
    learningSignals: input.intelligence?.patterns.length ?? 0,
    capacityConstrained: scheduleOverload(input.predictions) != null,
    recentChanges: derived.changes.length,
  };
}

function buildAlignment(input: StrategyInput): GoalAlignment[] {
  const nowIso = input.nowIso ?? new Date().toISOString();
  return activeGoals(input.goals).map((goal) => {
    const evidence: string[] = [];
    const plan = planFor(goal, input.plans);
    const staleDays = daysBetween(goal.updatedAt, nowIso);
    let level: GoalAlignmentLevel = "unclear";

    if (plan && plan.planStatus === "active") {
      evidence.push(`Linked to the active plan "${plan.title}".`);
      if (staleDays <= STALE_GOAL_DAYS) {
        evidence.push(`Updated ${staleDays} day(s) ago.`);
        level = "aligned";
      } else {
        evidence.push(`No update in ${staleDays} days.`);
        level = "weak";
      }
    } else if (HIGH_PRIORITY.has(goal.priority)) {
      evidence.push("Marked high priority but not linked to an active plan.");
      if (goal.progress < 20) evidence.push(`Progress is ${goal.progress}%.`);
      level = "weak";
    } else {
      evidence.push("No active plan linkage and no recent execution signal.");
      level = "unclear";
    }

    return { goalId: goal.id, goalTitle: goal.title, priority: goal.priority, level, evidence };
  });
}

function buildDrift(input: StrategyInput): DriftSignal[] {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const today = nowIso.slice(0, 10);
  const signals: DriftSignal[] = [];

  const stalledGoals = activeGoals(input.goals).filter(
    (goal) =>
      goal.goalStatus === "in-progress" &&
      goal.progress < 15 &&
      daysBetween(goal.updatedAt, nowIso) > STALE_GOAL_DAYS,
  );
  if (stalledGoals.length > 0) {
    signals.push({
      id: "drift:stalled-goals",
      type: "unscheduled-progress",
      statement: `Execution has diverged from ${stalledGoals.length} in-progress goal plan(s) over the last four weeks.`,
      evidence: stalledGoals
        .slice(0, 3)
        .map((goal) => `${goal.title}: ${goal.progress}%, last updated ${goal.updatedAt.slice(0, 10)}.`),
    });
  }

  const deferredPlans = input.plans.filter(
    (plan) =>
      plan.planStatus === "planned" && plan.startDate != null && plan.startDate < today,
  );
  if (deferredPlans.length > 0) {
    signals.push({
      id: "drift:deferred-plans",
      type: "postponed-plans",
      statement: `${deferredPlans.length} plan(s) have a start date in the past but are still not active.`,
      evidence: deferredPlans.slice(0, 3).map((plan) => `${plan.title} — start ${plan.startDate}.`),
    });
  }

  const unscheduledPriority = activeGoals(input.goals).filter(
    (goal) => HIGH_PRIORITY.has(goal.priority) && planFor(goal, input.plans)?.planStatus !== "active",
  );
  if (unscheduledPriority.length > 0) {
    signals.push({
      id: "drift:unscheduled-priority",
      type: "priority-without-plan",
      statement: `${unscheduledPriority.length} high-priority goal(s) have no active plan carrying them forward.`,
      evidence: unscheduledPriority.slice(0, 3).map((goal) => `${goal.title} (${goal.priority}).`),
    });
  }

  return signals;
}

function buildGoalHealth(input: StrategyInput): GoalHealth[] {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const attention = goalsAttentionInsights(input.intelligence);

  return input.goals
    .filter((goal) => goal.goalStatus !== "achieved" && goal.goalStatus !== "dropped")
    .map((goal) => {
      const reasons: string[] = [];
      const ageDays = daysBetween(goal.updatedAt, nowIso);
      const daysToTarget = goal.targetDate ? daysBetween(nowIso, `${goal.targetDate}T00:00:00.000Z`) : null;

      let state: GoalHealthState;
      if (goal.goalStatus === "on-hold") {
        state = "inactive";
        reasons.push("Goal is on hold.");
      } else if (goal.progress === 0 && goal.targetDate == null && ageDays <= 7) {
        state = "insufficient-data";
        reasons.push("Too new to assess — no progress, target or history yet.");
      } else if (goal.goalStatus === "in-progress" && goal.progress < 10 && ageDays > STALE_GOAL_DAYS) {
        state = "stalled";
        reasons.push(`Progress ${goal.progress}% with no update in ${ageDays} days.`);
      } else if (
        attention.length > 0 ||
        (daysToTarget != null && daysToTarget <= 30 && goal.progress < 70)
      ) {
        state = "at-risk";
        if (daysToTarget != null) reasons.push(`${daysToTarget} day(s) to target, ${goal.progress}% done.`);
        if (attention.length > 0) reasons.push("Flagged by the intelligence attention feed.");
      } else if (goal.goalStatus === "not-started") {
        state = "inactive";
        reasons.push("Not started.");
      } else {
        state = "on-track";
        reasons.push(`Progress ${goal.progress}%, updated ${ageDays} day(s) ago.`);
      }

      return { goalId: goal.id, goalTitle: goal.title, state, reasons };
    });
}

function buildBottlenecks(input: StrategyInput): Bottleneck[] {
  const bottlenecks: Bottleneck[] = [];
  const goalTitle = (id: string) => input.goals.find((goal) => goal.id === id)?.title ?? null;

  for (const decision of input.decisions ?? []) {
    if (!OPEN_DECISION_STATUSES.has(decision.status)) continue;
    if (decision.relatedGoals.length === 0) continue;
    bottlenecks.push({
      id: `bottleneck:decision:${decision.id}`,
      type: "DECISION",
      statement: `A decision linked to ${decision.relatedGoals.length} goal(s) is unresolved: "${decision.title}".`,
      relatedGoal: goalTitle(decision.relatedGoals[0] ?? ""),
      evidence: [`Decision status: ${decision.status.toLowerCase()}.`, decision.context].filter(Boolean),
    });
  }

  const overload = scheduleOverload(input.predictions);
  if (overload) {
    bottlenecks.push({
      id: "bottleneck:capacity",
      type: "CAPACITY",
      statement: "Scheduled focus appears to exceed available capacity.",
      relatedGoal: null,
      evidence: overload.evidence,
    });
  }

  const execAttention = (input.intelligence?.attention ?? []).filter(
    (insight) =>
      insight.relatedModule === "act" &&
      (insight.severity === "critical" || insight.severity === "high"),
  );
  if (execAttention.length > 0) {
    bottlenecks.push({
      id: "bottleneck:execution",
      type: "EXECUTION",
      statement: "Open execution items are competing with strategic progress.",
      relatedGoal: null,
      evidence: execAttention.slice(0, 3).map((insight) => insight.summary),
    });
  }

  return bottlenecks;
}

function buildOpportunities(input: StrategyInput): Opportunity[] {
  const opportunities: Opportunity[] = [];
  const nowIso = input.nowIso ?? new Date().toISOString();

  const recentlyAchieved = input.goals.filter(
    (goal) => goal.goalStatus === "achieved" && daysBetween(goal.updatedAt, nowIso) <= 21,
  );
  const nextPriority = activeGoals(input.goals).find((goal) => HIGH_PRIORITY.has(goal.priority));
  if (recentlyAchieved.length > 0 && nextPriority) {
    opportunities.push({
      id: "opp:freed-capacity",
      observation: `Completing "${recentlyAchieved[0]?.title}" may free capacity.`,
      evidence: [`${recentlyAchieved.length} goal(s) reached "achieved" in the last three weeks.`],
      potentialBenefit: `That capacity could shift toward "${nextPriority.title}".`,
      assumptions: ["The freed time is not already committed elsewhere."],
    });
  }

  if (!scheduleOverload(input.predictions)) {
    const weakHighPriority = buildAlignment(input).find(
      (row) => row.level === "weak" && HIGH_PRIORITY.has(row.priority),
    );
    if (weakHighPriority) {
      opportunities.push({
        id: "opp:unallocated-focus",
        observation: "No capacity-overload signal is present while a high-priority goal is weakly carried.",
        evidence: [`"${weakHighPriority.goalTitle}" is high priority but weakly aligned.`],
        potentialBenefit: "Some focus capacity could be directed to this goal without overloading the week.",
        assumptions: ["Current focus data reflects real availability."],
      });
    }
  }

  const pillarCount = new Map<string, string[]>();
  for (const goal of activeGoals(input.goals)) {
    for (const pillar of goal.pillarIds) {
      pillarCount.set(pillar, [...(pillarCount.get(pillar) ?? []), goal.title]);
    }
  }
  for (const [pillar, titles] of pillarCount) {
    if (titles.length >= 2) {
      opportunities.push({
        id: `opp:shared-pillar:${pillar}`,
        observation: `${titles.length} active goals share the ${pillar} area.`,
        evidence: titles.slice(0, 3),
        potentialBenefit: "One plan or focus block may advance more than one of them.",
        assumptions: ["The goals are genuinely complementary, not just same-category."],
      });
      break;
    }
  }

  return opportunities;
}

function buildTradeOffs(input: StrategyInput, goalHealth: GoalHealth[]): TradeOff[] {
  const tradeOffs: TradeOff[] = [];
  const strainedHighPriority = activeGoals(input.goals)
    .filter((goal) => HIGH_PRIORITY.has(goal.priority))
    .filter((goal) => {
      const health = goalHealth.find((row) => row.goalId === goal.id);
      return health?.state === "at-risk" || health?.state === "stalled";
    });

  if (strainedHighPriority.length >= 2) {
    const [a, b] = strainedHighPriority;
    tradeOffs.push({
      id: "tradeoff:competing-priorities",
      optionA: `Concentrate on "${a?.title}"`,
      optionB: `Concentrate on "${b?.title}"`,
      tradeOff: "Both are high priority and currently strained; focus given to one is focus withheld from the other.",
      potentialConsequence: "Splitting attention evenly may leave both behind their target.",
    });
  }

  const deadline = deadlineSignals(input.predictions)[0];
  const strategicGoal = strainedHighPriority[0] ?? activeGoals(input.goals).find((g) => HIGH_PRIORITY.has(g.priority));
  if (deadline && strategicGoal) {
    tradeOffs.push({
      id: "tradeoff:deadline-vs-strategy",
      optionA: `Clear the near-term deadline (${deadline.prediction})`,
      optionB: `Protect strategic time for "${strategicGoal.title}"`,
      tradeOff: "Prioritising the immediate deadline may delay the strategic goal.",
      potentialConsequence: "Repeatedly choosing the deadline can accumulate into strategic drift.",
    });
  }

  return tradeOffs;
}

function buildScenarios(input: StrategyInput): Scenario[] {
  const overload = scheduleOverload(input.predictions);
  const deadline = deadlineSignals(input.predictions)[0];
  const predictionsUsable = (input.predictions?.enabled ?? false) && input.predictions?.status === "ready";
  const horizon: ScenarioHorizon = predictionsUsable ? "short" : "limited-data";
  const predictionNote = predictionsUsable
    ? []
    : ["Limited predictive data — implications are directional only."];

  const topGoal = activeGoals(input.goals).find((goal) => HIGH_PRIORITY.has(goal.priority));

  return [
    {
      kind: "current-course",
      title: "Current course",
      description: "Continue the present allocation of focus and priorities.",
      implications: [
        overload
          ? "Capacity-overload signal is active, so delay risk stays elevated."
          : "No capacity-overload signal; steady progress is the likely path.",
        deadline ? `Deadline risk remains: ${deadline.prediction}` : "No elevated deadline risk detected.",
        ...predictionNote,
      ],
      horizon,
    },
    {
      kind: "accelerate",
      title: "Accelerate a goal",
      description: topGoal
        ? `Increase focus allocation toward "${topGoal.title}".`
        : "Increase focus allocation toward the most important goal.",
      implications: [
        "Faster movement on the chosen goal.",
        overload
          ? "Adds load to an already-overloaded week — something else must give."
          : "Draws capacity from other work; lower-priority items slow down.",
        ...predictionNote,
      ],
      horizon,
    },
    {
      kind: "defer",
      title: "Defer lower-priority work",
      description: "Move lower-priority commitments out of the active window.",
      implications: [
        "Frees focus for strategic goals.",
        "Deferred work still has to land later; the backlog grows.",
        ...predictionNote,
      ],
      horizon,
    },
    {
      kind: "reduce",
      title: "Reduce commitments",
      description: "Drop or pause a commitment rather than reschedule it.",
      implications: [
        "Largest capacity relief of the options.",
        "Irreversible for that commitment; revisit only through an explicit decision.",
        ...predictionNote,
      ],
      horizon,
    },
    {
      kind: "restructure",
      title: "Restructure the plan",
      description: "Re-sequence goals and plans so the highest-priority objective is carried by an active plan.",
      implications: [
        "Better alignment between stated priority and scheduled work.",
        "Planning cost up front; benefits appear over weeks, not days.",
        ...predictionNote,
      ],
      horizon: predictionsUsable ? "medium" : "limited-data",
    },
  ];
}

export interface WhatIfInput {
  kind: "defer-project" | "increase-focus" | "add-project" | "reduce-commitment";
  targetGoalId?: string;
}

export interface WhatIfResult {
  question: string;
  facts: string[];
  estimates: string[];
  assumptions: string[];
}

/** Controlled what-if: separates FACT / ESTIMATE / ASSUMPTION and stays silent
 * on any projection the data cannot support. */
export function analyzeWhatIf(input: StrategyInput, whatIf: WhatIfInput): WhatIfResult {
  const facts: string[] = [];
  const estimates: string[] = [];
  const assumptions: string[] = [];
  const goal = whatIf.targetGoalId
    ? input.goals.find((item) => item.id === whatIf.targetGoalId) ?? null
    : null;
  const overload = scheduleOverload(input.predictions);

  const active = activeGoals(input.goals);
  facts.push(`${active.length} active goal(s), ${input.plans.filter((p) => p.planStatus === "active").length} active plan(s).`);
  if (overload) facts.push("A capacity-overload signal is currently active.");

  switch (whatIf.kind) {
    case "defer-project":
      facts.push(`${input.plans.filter((p) => p.planStatus === "active").length} plan(s) would remain active.`);
      estimates.push(
        overload
          ? "Deferring one plan is likely to relieve the current overload signal."
          : "Capacity effect is small — no overload signal to relieve.",
      );
      assumptions.push("The deferred plan has no hard external deadline.");
      break;
    case "increase-focus":
      if (goal) facts.push(`"${goal.title}" is at ${goal.progress}% (${goal.priority} priority).`);
      estimates.push("Progress on the chosen goal speeds up; other active work slows proportionally.");
      assumptions.push("Total available focus time is unchanged.");
      break;
    case "add-project":
      estimates.push(
        overload
          ? "Adding a project while overloaded raises delay risk across the portfolio."
          : "Spare capacity may absorb a small project; margin for the unexpected shrinks.",
      );
      assumptions.push("The new project is comparable in size to current active plans.");
      break;
    case "reduce-commitment":
      estimates.push("Frees the most capacity of any option; the reduced commitment stops progressing.");
      assumptions.push("The commitment can be paused without a cascading dependency.");
      break;
  }

  if (!input.predictions || !input.predictions.enabled) {
    assumptions.push("Predictions are unavailable, so estimates are directional only.");
  }

  return {
    question: whatIfQuestion(whatIf, goal?.title),
    facts,
    estimates,
    assumptions,
  };
}

function whatIfQuestion(whatIf: WhatIfInput, goalTitle?: string): string {
  switch (whatIf.kind) {
    case "defer-project":
      return "What if I postpone an active project?";
    case "increase-focus":
      return goalTitle ? `What if I increase focus on "${goalTitle}"?` : "What if I increase focus on a goal?";
    case "add-project":
      return "What if I add another active project?";
    case "reduce-commitment":
      return "What if I reduce a commitment?";
  }
}

function buildStrategicDebt(input: StrategyInput): StrategicDebtItem[] {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const today = nowIso.slice(0, 10);
  const items: StrategicDebtItem[] = [];

  for (const decision of input.decisions ?? []) {
    if (!OPEN_DECISION_STATUSES.has(decision.status) || !decision.dueDate || decision.dueDate >= today) {
      continue;
    }
    const ageDays = daysBetween(`${decision.dueDate}T00:00:00.000Z`, nowIso);
    items.push({
      id: `debt:decision:${decision.id}`,
      item: `Postponed decision: "${decision.title}"`,
      ageDays,
      impact: ageDays > 30 ? "high" : ageDays > 14 ? "medium" : "low",
      source: "decisions",
      recommendedReview: "Resolve or explicitly defer with a new date.",
    });
  }

  for (const goal of activeGoals(input.goals)) {
    const ageDays = daysBetween(goal.updatedAt, nowIso);
    if (goal.goalStatus === "in-progress" && ageDays > DEBT_GOAL_DAYS) {
      items.push({
        id: `debt:goal:${goal.id}`,
        item: `Stale goal: "${goal.title}" (no update in ${ageDays} days)`,
        ageDays,
        impact: HIGH_PRIORITY.has(goal.priority) ? "high" : "medium",
        source: "goals",
        recommendedReview: "Confirm the goal still matters, or move it to on-hold.",
      });
    }
  }

  for (const plan of input.plans) {
    if (
      (plan.planStatus === "active" || plan.planStatus === "planned") &&
      plan.endDate != null &&
      plan.endDate < today
    ) {
      const ageDays = daysBetween(`${plan.endDate}T00:00:00.000Z`, nowIso);
      items.push({
        id: `debt:plan:${plan.id}`,
        item: `Plan past its end date: "${plan.title}"`,
        ageDays,
        impact: "medium",
        source: "plans",
        recommendedReview: "Close it out or extend the horizon deliberately.",
      });
    }
  }

  return items.sort((a, b) => b.ageDays - a.ageDays);
}

function buildChanges(input: StrategyInput): ChangeItem[] {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const changes: ChangeItem[] = [];

  for (const goal of input.goals) {
    if (goal.goalStatus === "achieved" && daysBetween(goal.updatedAt, nowIso) <= 14) {
      changes.push({
        id: `change:goal-achieved:${goal.id}`,
        kind: "RESOLVED",
        area: "GOALS",
        statement: `"${goal.title}" reached achieved.`,
      });
    }
  }

  if (input.brain && input.brain.availability === "ready") {
    for (const id of ["goals", "plan", "focus", "act", "grow", "analytics"] as const) {
      if (input.brain.modules[id].recentEvent) {
        changes.push({
          id: `change:brain:${id}`,
          kind: "CHANGED",
          area: id.toUpperCase(),
          statement: `Recent activity recorded in ${id}.`,
        });
      }
    }
  }

  return changes.slice(0, 8);
}

function buildAllocation(input: StrategyInput): AllocationRow[] {
  const rows: AllocationRow[] = [];
  const highPriorityWeaklyCarried = buildAlignment(input).filter(
    (row) => HIGH_PRIORITY.has(row.priority) && row.level !== "aligned",
  );

  if (highPriorityWeaklyCarried.length > 0) {
    rows.push({
      area: "FOCUS",
      statement: `${highPriorityWeaklyCarried.length} high-priority goal(s) have focus allocation lower than their stated priority.`,
      evidence: highPriorityWeaklyCarried.slice(0, 3).map((row) => `${row.goalTitle}: ${row.level} alignment.`),
    });
  }

  const overload = scheduleOverload(input.predictions);
  if (overload) {
    rows.push({
      area: "TIME",
      statement: "Total scheduled time is above sustainable capacity for the current window.",
      evidence: overload.evidence,
    });
  }

  return rows;
}

function buildPortfolio(input: StrategyInput, goalHealth: GoalHealth[]): PortfolioItem[] {
  const items: PortfolioItem[] = [];

  for (const goal of input.goals) {
    if (goal.goalStatus === "dropped") continue;
    const health = goalHealth.find((row) => row.goalId === goal.id);
    const status: PortfolioItem["status"] =
      goal.goalStatus === "achieved"
        ? "COMPLETED"
        : goal.goalStatus === "on-hold"
          ? "BLOCKED"
          : goal.goalStatus === "not-started"
            ? "PLANNED"
            : health?.state === "at-risk" || health?.state === "stalled"
              ? "AT_RISK"
              : "ACTIVE";
    items.push({
      id: `portfolio:goal:${goal.id}`,
      name: goal.title,
      kind: "goal",
      status,
      goalAlignment: goal.parentPlanId ? "linked to a plan" : "no plan linkage",
      priority: goal.priority,
      risk: status === "AT_RISK" ? "high" : status === "BLOCKED" ? "medium" : "low",
      progress: goal.progress,
    });
  }

  for (const plan of input.plans) {
    const status: PortfolioItem["status"] =
      plan.planStatus === "complete"
        ? "COMPLETED"
        : plan.planStatus === "abandoned"
          ? "BLOCKED"
          : plan.planStatus === "planned"
            ? "PLANNED"
            : "ACTIVE";
    items.push({
      id: `portfolio:plan:${plan.id}`,
      name: plan.title,
      kind: "plan",
      status,
      goalAlignment: `${plan.horizon} horizon`,
      priority: "—",
      risk: "low",
      progress: plan.progress,
    });
  }

  return items;
}

function confidenceFromEvidence(evidenceCount: number, predictionsUsable: boolean): StrategyConfidence {
  if (evidenceCount === 0) return "insufficient-data";
  if (evidenceCount >= 3 && predictionsUsable) return "high";
  if (evidenceCount >= 2) return "medium";
  return "low";
}

function buildRecommendations(
  input: StrategyInput,
  parts: {
    drift: DriftSignal[];
    bottlenecks: Bottleneck[];
    tradeOffs: TradeOff[];
    opportunities: Opportunity[];
  },
): StrategyRecommendation[] {
  const predictionsUsable =
    (input.predictions?.enabled ?? false) && input.predictions?.status === "ready";
  const recommendations: StrategyRecommendation[] = [];

  for (const signal of parts.drift.slice(0, 2)) {
    recommendations.push({
      id: `rec:${signal.id}`,
      title: "Review where execution has diverged from plan",
      observation: signal.statement,
      evidence: signal.evidence,
      option: "Open a strategic review of the affected goals and decide: keep, re-plan, or pause.",
      expectedBenefit: "Stated priorities and scheduled work move back into agreement.",
      potentialDownside: "Re-planning takes time this week and may surface a hard trade-off.",
      confidence: confidenceFromEvidence(signal.evidence.length, predictionsUsable),
      userAction: "REVIEW",
    });
  }

  const topBottleneck = parts.bottlenecks[0];
  if (topBottleneck) {
    recommendations.push({
      id: `rec:${topBottleneck.id}`,
      title: `Clear the ${topBottleneck.type.toLowerCase()} bottleneck`,
      observation: topBottleneck.statement,
      evidence: topBottleneck.evidence,
      option:
        topBottleneck.type === "DECISION"
          ? "Take the linked decision to a resolution in the decision workspace."
          : "Reduce or re-sequence the competing work before adding more.",
      expectedBenefit: "Removes the specific thing currently holding progress back.",
      potentialDownside: "May require saying no to something that currently feels urgent.",
      confidence: confidenceFromEvidence(topBottleneck.evidence.length, predictionsUsable),
      userAction: "REVIEW",
    });
  }

  const topTradeOff = parts.tradeOffs[0];
  if (topTradeOff) {
    recommendations.push({
      id: `rec:${topTradeOff.id}`,
      title: "Make the trade-off explicit",
      observation: `${topTradeOff.optionA} vs ${topTradeOff.optionB}.`,
      evidence: [topTradeOff.tradeOff, topTradeOff.potentialConsequence],
      option: "Choose one to lead this window rather than splitting attention evenly.",
      expectedBenefit: "One objective moves decisively instead of two moving slowly.",
      potentialDownside: "The un-chosen objective visibly waits.",
      confidence: "medium",
      userAction: "REVIEW",
    });
  }

  const topOpportunity = parts.opportunities[0];
  if (topOpportunity) {
    recommendations.push({
      id: `rec:${topOpportunity.id}`,
      title: "Consider an available opportunity",
      observation: topOpportunity.observation,
      evidence: topOpportunity.evidence,
      option: topOpportunity.potentialBenefit,
      expectedBenefit: topOpportunity.potentialBenefit,
      potentialDownside: `Assumes: ${topOpportunity.assumptions.join("; ")}.`,
      confidence: confidenceFromEvidence(topOpportunity.evidence.length, predictionsUsable),
      userAction: "REVIEW",
    });
  }

  return recommendations;
}

/** Fold every already-derived input into one advisory strategy view. Pure. */
export function buildStrategy(input: StrategyInput): StrategyState {
  const nowIso = input.nowIso ?? new Date().toISOString();

  const alignment = buildAlignment(input);
  const drift = buildDrift(input);
  const goalHealth = buildGoalHealth(input);
  const bottlenecks = buildBottlenecks(input);
  const opportunities = buildOpportunities(input);
  const tradeOffs = buildTradeOffs(input, goalHealth);
  const scenarios = buildScenarios(input);
  const strategicDebt = buildStrategicDebt(input);
  const changes = buildChanges(input);
  const allocation = buildAllocation(input);
  const portfolio = buildPortfolio(input, goalHealth);
  const recommendations = buildRecommendations(input, { drift, bottlenecks, tradeOffs, opportunities });
  const context = buildContext(input, { drift, changes });

  const degraded: string[] = [];
  if (!input.intelligence || input.intelligence.status === "error") {
    degraded.push("Intelligence signals unavailable — strategy runs on goals, plans and decisions only.");
  }
  if (!input.predictions || input.predictions.status === "error") {
    degraded.push("Predictions unavailable — scenarios are directional, not projected.");
  } else if (!input.predictions.enabled) {
    degraded.push("Predictions are turned off — scenario horizons are limited.");
  }
  if (input.goals.length === 0) {
    degraded.push("No goals yet — strategic analysis needs at least one goal to work from.");
  }

  return {
    generatedAt: nowIso,
    context,
    alignment,
    drift,
    goalHealth,
    bottlenecks,
    opportunities,
    tradeOffs,
    scenarios,
    strategicDebt,
    changes,
    allocation,
    portfolio,
    recommendations,
    degraded,
  };
}

export interface StrategicReview {
  kind: ReviewKind;
  generatedAt: string;
  movedForward: string[];
  didNotMove: string[];
  whyItMayMatter: string[];
  atRisk: string[];
  changed: string[];
  toReview: string[];
  /** Monthly only. */
  categories?: { keep: string[]; change: string[]; stop: string[]; start: string[] };
  /** Quarterly only. */
  questions?: string[];
}

/** Build a concise strategic summary for the chosen cadence. Pure — the same
 * strategy state always produces the same review. */
export function buildStrategicReview(
  kind: ReviewKind,
  input: StrategyInput,
  strategy: StrategyState,
): StrategicReview {
  const nowIso = input.nowIso ?? new Date().toISOString();

  const movedForward = strategy.portfolio
    .filter((item) => item.kind === "goal" && (item.progress ?? 0) >= 50 && item.status === "ACTIVE")
    .slice(0, 5)
    .map((item) => `${item.name} — ${item.progress}%`);

  const didNotMove = strategy.goalHealth
    .filter((row) => row.state === "stalled" || row.state === "inactive")
    .slice(0, 5)
    .map((row) => `${row.goalTitle} (${row.state})`);

  const whyItMayMatter = strategy.drift.slice(0, 3).map((signal) => `Possible contributing factor: ${signal.statement}`);

  const atRisk = strategy.goalHealth
    .filter((row) => row.state === "at-risk")
    .slice(0, 5)
    .map((row) => `${row.goalTitle}: ${row.reasons[0] ?? "at risk"}`);

  const changed = strategy.changes.slice(0, 5).map((change) => `${change.kind}: ${change.statement}`);

  const toReview = [
    ...strategy.recommendations.slice(0, 3).map((rec) => rec.title),
    ...strategy.strategicDebt.slice(0, 2).map((debt) => debt.item),
  ];

  const review: StrategicReview = {
    kind,
    generatedAt: nowIso,
    movedForward,
    didNotMove,
    whyItMayMatter,
    atRisk,
    changed,
    toReview,
  };

  if (kind === "monthly") {
    review.categories = {
      keep: strategy.alignment.filter((row) => row.level === "aligned").slice(0, 4).map((row) => row.goalTitle),
      change: strategy.alignment.filter((row) => row.level === "weak").slice(0, 4).map((row) => row.goalTitle),
      stop: strategy.strategicDebt.filter((debt) => debt.impact === "high").slice(0, 3).map((debt) => debt.item),
      start: strategy.opportunities.slice(0, 3).map((opp) => opp.observation),
    };
  }

  if (kind === "quarterly") {
    review.questions = [
      "Which objectives still matter this quarter?",
      strategy.portfolio.some((item) => item.status === "AT_RISK")
        ? "Which at-risk initiatives should be re-planned or dropped?"
        : "Which projects no longer support current priorities?",
      strategy.context.capacityConstrained
        ? "Where is capacity being consumed, and is that deliberate?"
        : "Which goal deserves greater focus next quarter?",
    ];
  }

  return review;
}

export const STRATEGY_CONFIDENCE_LABEL: Record<StrategyConfidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  "insufficient-data": "Insufficient data",
};

export function isEmptyStrategy(state: StrategyState): boolean {
  return (
    state.alignment.length === 0 &&
    state.drift.length === 0 &&
    state.goalHealth.length === 0 &&
    state.bottlenecks.length === 0 &&
    state.opportunities.length === 0 &&
    state.strategicDebt.length === 0 &&
    state.portfolio.length === 0 &&
    state.recommendations.length === 0
  );
}
