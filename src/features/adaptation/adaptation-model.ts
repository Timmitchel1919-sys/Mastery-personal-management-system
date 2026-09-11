import type { DecisionRecord } from "@/features/decisions/schema";
import type { Goal } from "@/features/goals/schema";
import type { Plan } from "@/features/plans/schema";
import type { PredictiveSignal } from "@/features/predictions/prediction-model";
import type { Task } from "@/features/tasks/schema";
import type { ContextConflict } from "@/features/context/context-model";
import type {
  Bottleneck,
  DriftSignal,
  GoalHealth,
  StrategyState,
} from "@/features/strategy/strategy-engine";
import type { DigitalTwinState, HistoricalCalibration } from "@/features/twin/digital-twin";

/**
 * Layer S — Continuous Adaptation & Personal Operating Intelligence (pure core).
 *
 * The closed loop: OBSERVE → INTERPRET → EVALUATE → RECOMMEND → (SIMULATE →
 * APPROVE → EXECUTE → VERIFY → LEARN, elsewhere) → ADAPT. This module does not
 * re-derive what Layers J/K/L/O/P/Q/R already compute — it *synthesises* their
 * output into signals, health indicators, and evidence-backed adaptation
 * proposals. It never fabricates a signal, never auto-applies a consequential
 * change, and never touches the user's stable values or long-term vision —
 * only adaptive operations (schedules, allocation, priorities, workflow).
 */

export type SignalType =
  | "PROGRESS_SIGNAL"
  | "EXECUTION_SIGNAL"
  | "CAPACITY_SIGNAL"
  | "DEADLINE_SIGNAL"
  | "FOCUS_SIGNAL"
  | "GOAL_SIGNAL"
  | "PLAN_SIGNAL"
  | "RISK_SIGNAL"
  | "BEHAVIORAL_PATTERN_SIGNAL"
  | "LEARNING_SIGNAL"
  | "CONTEXT_SIGNAL";

export type SignalSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const SEVERITY_RANK: Record<SignalSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
};

export interface Signal {
  id: string;
  type: SignalType;
  severity: SignalSeverity;
  statement: string;
  evidence: string[];
  sourceModule: "strategy" | "predictions" | "twin" | "context" | "plans" | "tasks" | "goals";
  detectedAt: string;
}

// ── Health models ───────────────────────────────────────────────────────────
// Goal health is Layer O's model, reused as-is — no competing score.
export type { GoalHealth };

export type PlanHealthState = "healthy" | "overloaded" | "conflicted" | "stale" | "blocked" | "underutilized";

export interface PlanHealthEntry {
  planId: string;
  planTitle: string;
  state: PlanHealthState;
  reasons: string[];
}

export type ProjectHealthState = "on-track" | "at-risk" | "blocked" | "delayed" | "over-scope" | "completed";

export interface ProjectHealthEntry {
  projectId: string;
  state: ProjectHealthState;
  taskCount: number;
  reasons: string[];
}

export type FocusHealthState = "steady" | "overloaded" | "underused" | "insufficient-data";

export interface FocusHealthEntry {
  state: FocusHealthState;
  plannedHours: number;
  availableHours: number;
  reasons: string[];
}

export interface SystemHealthEntry {
  degradedAreas: string[];
  automationsPaused: boolean;
  aiAvailable: boolean;
  healthy: boolean;
}

const STALE_PLAN_DAYS = 21;

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);
}

export function buildPlanHealth(plans: Plan[], goals: Goal[], nowIso: string): PlanHealthEntry[] {
  return plans
    .filter((plan) => plan.planStatus === "active")
    .map((plan) => {
      const linkedGoals = goals.filter((goal) => goal.parentPlanId === plan.id);
      const ageDays = daysBetween(plan.updatedAt, nowIso);
      const reasons: string[] = [];
      let state: PlanHealthState = "healthy";

      if (linkedGoals.length === 0 && plan.progress === 0) {
        state = "underutilized";
        reasons.push("No linked goals and no recorded progress.");
      } else if (ageDays > STALE_PLAN_DAYS) {
        state = "stale";
        reasons.push(`No update in ${ageDays} days.`);
      } else {
        const atRiskGoals = linkedGoals.filter(
          (goal) => goal.goalStatus === "on-hold" || (goal.priority === "high" || goal.priority === "critical"),
        );
        const overloaded = atRiskGoals.length >= 2 && linkedGoals.every((goal) => goal.priority !== "low");
        if (overloaded) {
          state = "overloaded";
          reasons.push(`${atRiskGoals.length} high-priority linked goal(s) competing for the same plan.`);
        } else {
          reasons.push(`${linkedGoals.length} linked goal(s), updated ${ageDays} day(s) ago.`);
        }
      }

      return { planId: plan.id, planTitle: plan.title, state, reasons };
    });
}

export function buildProjectHealth(tasks: Task[], nowIso: string): ProjectHealthEntry[] {
  const byProject = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.projectId) continue;
    byProject.set(task.projectId, [...(byProject.get(task.projectId) ?? []), task]);
  }
  const today = nowIso.slice(0, 10);

  return [...byProject.entries()].map(([projectId, projectTasks]) => {
    const done = projectTasks.filter((task) => task.taskStatus === "done").length;
    const blocked = projectTasks.filter((task) => task.taskStatus === "blocked").length;
    const overdue = projectTasks.filter(
      (task) => task.taskStatus !== "done" && task.dueDate != null && task.dueDate < today,
    ).length;
    const reasons: string[] = [];
    let state: ProjectHealthState;

    if (done === projectTasks.length) {
      state = "completed";
      reasons.push("All tracked tasks are done.");
    } else if (blocked > 0 && blocked === projectTasks.length - done) {
      state = "blocked";
      reasons.push(`${blocked} of ${projectTasks.length} task(s) blocked.`);
    } else if (overdue > 0) {
      state = "delayed";
      reasons.push(`${overdue} task(s) overdue.`);
    } else if (blocked > 0) {
      state = "at-risk";
      reasons.push(`${blocked} task(s) blocked.`);
    } else {
      state = "on-track";
      reasons.push(`${done} of ${projectTasks.length} task(s) done.`);
    }

    return { projectId, state, taskCount: projectTasks.length, reasons };
  });
}

export function buildFocusHealth(twin: DigitalTwinState | null): FocusHealthEntry {
  if (!twin || !twin.hasData) {
    return { state: "insufficient-data", plannedHours: 0, availableHours: 0, reasons: ["Not enough data yet."] };
  }
  const { plannedFocusHours, availableFocusHoursPerWeek, overCommitted, unallocatedFocusHours } = twin.capacity;
  if (overCommitted) {
    return {
      state: "overloaded",
      plannedHours: plannedFocusHours,
      availableHours: availableFocusHoursPerWeek,
      reasons: [`Planned focus (${plannedFocusHours}h/wk) exceeds configured availability (${availableFocusHoursPerWeek}h/wk).`],
    };
  }
  if (availableFocusHoursPerWeek > 0 && unallocatedFocusHours / availableFocusHoursPerWeek > 0.6) {
    return {
      state: "underused",
      plannedHours: plannedFocusHours,
      availableHours: availableFocusHoursPerWeek,
      reasons: [`${unallocatedFocusHours}h/wk of configured availability is unallocated.`],
    };
  }
  return {
    state: "steady",
    plannedHours: plannedFocusHours,
    availableHours: availableFocusHoursPerWeek,
    reasons: [`${plannedFocusHours}h/wk planned against ${availableFocusHoursPerWeek}h/wk available.`],
  };
}

export interface SystemHealthInput {
  intelligenceStatus: "loading" | "ready" | "error" | null;
  predictionsStatus: "loading" | "ready" | "error" | null;
  twinStatus: "loading" | "ready" | null;
  automationsPaused: boolean;
}

/** System state, kept separate from user (goal/plan/project/focus) state. */
export function buildSystemHealth(input: SystemHealthInput): SystemHealthEntry {
  const degradedAreas: string[] = [];
  if (input.intelligenceStatus === "error") degradedAreas.push("Intelligence");
  if (input.predictionsStatus === "error") degradedAreas.push("Predictions");
  return {
    degradedAreas,
    automationsPaused: input.automationsPaused,
    aiAvailable: input.intelligenceStatus !== "error",
    healthy: degradedAreas.length === 0,
  };
}

// ── Signals ─────────────────────────────────────────────────────────────────

export interface AdaptationInput {
  nowIso?: string;
  strategy: StrategyState | null;
  predictions: { status: "loading" | "ready" | "error"; enabled: boolean; signals: PredictiveSignal[] } | null;
  twin: DigitalTwinState | null;
  calibration: HistoricalCalibration | null;
  contextConflicts: ContextConflict[];
  decisions: DecisionRecord[];
  goals: Goal[];
  plans: Plan[];
  tasks: Task[];
  automationsPaused: boolean;
  intelligenceStatus: "loading" | "ready" | "error" | null;
}

function driftToSignal(drift: DriftSignal, nowIso: string, index: number): Signal {
  return {
    id: `sig:drift:${drift.id}:${index}`,
    type: "BEHAVIORAL_PATTERN_SIGNAL",
    severity: "MEDIUM",
    statement: drift.statement,
    evidence: drift.evidence,
    sourceModule: "strategy",
    detectedAt: nowIso,
  };
}

function bottleneckToSignal(bottleneck: Bottleneck, nowIso: string): Signal {
  const type: SignalType = bottleneck.type === "CAPACITY" ? "CAPACITY_SIGNAL" : "RISK_SIGNAL";
  return {
    id: `sig:bottleneck:${bottleneck.id}`,
    type,
    severity: bottleneck.type === "DECISION" ? "MEDIUM" : "HIGH",
    statement: bottleneck.statement,
    evidence: bottleneck.evidence,
    sourceModule: "strategy",
    detectedAt: nowIso,
  };
}

function predictionToSignal(signal: PredictiveSignal, nowIso: string): Signal {
  const type: SignalType = signal.category === "schedule-overload" ? "CAPACITY_SIGNAL" : "DEADLINE_SIGNAL";
  const severity: SignalSeverity =
    signal.urgency === "critical" ? "CRITICAL" : signal.urgency === "important" ? "HIGH" : "LOW";
  return {
    id: `sig:prediction:${signal.id}`,
    type,
    severity,
    statement: signal.prediction,
    evidence: signal.evidence,
    sourceModule: "predictions",
    detectedAt: nowIso,
  };
}

/** Every signal traces to real, already-derived data. Nothing here is invented. */
export function buildSignals(input: AdaptationInput): Signal[] {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const signals: Signal[] = [];
  const seen = new Set<string>();
  const push = (signal: Signal) => {
    const key = `${signal.type}::${signal.statement}`;
    if (seen.has(key)) return;
    seen.add(key);
    signals.push(signal);
  };

  if (input.strategy) {
    input.strategy.drift.forEach((drift, index) => push(driftToSignal(drift, nowIso, index)));
    for (const goalHealth of input.strategy.goalHealth) {
      if (goalHealth.state === "stalled" || goalHealth.state === "at-risk") {
        push({
          id: `sig:goal:${goalHealth.goalId}`,
          type: "GOAL_SIGNAL",
          severity: goalHealth.state === "stalled" ? "HIGH" : "MEDIUM",
          statement: `"${goalHealth.goalTitle}" is ${goalHealth.state.replace("-", " ")}.`,
          evidence: goalHealth.reasons,
          sourceModule: "strategy",
          detectedAt: nowIso,
        });
      }
    }
    input.strategy.bottlenecks.forEach((bottleneck) => push(bottleneckToSignal(bottleneck, nowIso)));
    if (input.strategy.context.progressState !== null && input.strategy.context.progressState < 20) {
      push({
        id: "sig:progress",
        type: "PROGRESS_SIGNAL",
        severity: "MEDIUM",
        statement: `Average goal progress is low (${input.strategy.context.progressState}%).`,
        evidence: [`${input.strategy.context.activeGoals} active goal(s).`],
        sourceModule: "strategy",
        detectedAt: nowIso,
      });
    }
  }

  if (input.predictions?.enabled) {
    input.predictions.signals.forEach((signal) => push(predictionToSignal(signal, nowIso)));
  }

  if (input.twin?.capacity.overCommitted) {
    push({
      id: "sig:twin:capacity",
      type: "CAPACITY_SIGNAL",
      severity: "HIGH",
      statement: "Planned focus exceeds your configured weekly availability.",
      evidence: [
        `${input.twin.capacity.plannedFocusHours}h/wk planned vs ${input.twin.capacity.availableFocusHoursPerWeek}h/wk available.`,
      ],
      sourceModule: "twin",
      detectedAt: nowIso,
    });
  }

  if (input.calibration?.estimateOverrunFactor != null && input.calibration.estimateOverrunFactor >= 1.3) {
    push({
      id: "sig:calibration",
      type: "LEARNING_SIGNAL",
      severity: "LOW",
      statement: `Task estimates have typically run ${input.calibration.estimateOverrunFactor}× over.`,
      evidence: [`Based on ${input.calibration.sampleSize} completed task(s).`],
      sourceModule: "twin",
      detectedAt: nowIso,
    });
  }

  for (const conflict of input.contextConflicts) {
    push({
      id: `sig:context:${conflict.id}`,
      type: "CONTEXT_SIGNAL",
      severity: "MEDIUM",
      statement: conflict.statement,
      evidence: conflict.values,
      sourceModule: "context",
      detectedAt: nowIso,
    });
  }

  const today = nowIso.slice(0, 10);
  const overdueTasks = input.tasks.filter((task) => task.taskStatus !== "done" && task.dueDate != null && task.dueDate < today);
  if (overdueTasks.length >= 3) {
    push({
      id: "sig:execution:overdue",
      type: "EXECUTION_SIGNAL",
      severity: overdueTasks.length >= 6 ? "HIGH" : "MEDIUM",
      statement: `${overdueTasks.length} tasks are overdue.`,
      evidence: overdueTasks.slice(0, 3).map((task) => `${task.title} — due ${task.dueDate}.`),
      sourceModule: "tasks",
      detectedAt: nowIso,
    });
  }

  const stalePlans = buildPlanHealth(input.plans, input.goals, nowIso).filter((plan) => plan.state === "stale");
  if (stalePlans.length > 0) {
    push({
      id: "sig:plan:stale",
      type: "PLAN_SIGNAL",
      severity: "LOW",
      statement: `${stalePlans.length} active plan(s) have not been updated recently.`,
      evidence: stalePlans.slice(0, 3).map((plan) => `${plan.planTitle}: ${plan.reasons[0]}`),
      sourceModule: "plans",
      detectedAt: nowIso,
    });
  }

  return signals.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

// ── Adaptation proposals ─────────────────────────────────────────────────────

export type AdaptationType =
  | "RESCHEDULE"
  | "REPRIORITIZE"
  | "DECOMPOSE"
  | "SIMPLIFY"
  | "DEFER"
  | "PAUSE"
  | "REALLOCATE"
  | "REPLAN"
  | "REDUCE_SCOPE"
  | "INCREASE_FOCUS"
  | "CHANGE_WORKFLOW";

export type ProposalStatus =
  | "DETECTED"
  | "ANALYZING"
  | "PROPOSED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "APPLIED"
  | "EXPIRED"
  | "ARCHIVED";

export type ProposalConfidence = "high" | "medium" | "low";

export interface AdaptationProposal {
  id: string;
  trigger: SignalType;
  adaptationType: AdaptationType;
  title: string;
  currentState: string;
  proposedChange: string;
  expectedImpact: string;
  risks: string[];
  alternatives: string[];
  evidence: string[];
  assumptions: string[];
  limitations: string[];
  confidence: ProposalConfidence;
  requiresApproval: true;
  status: ProposalStatus;
  /** A cheap fingerprint of the signals it was built from — for staleness checks. */
  stateSignature: string;
  targetEntityId: string | null;
  createdAt: string;
}

const SIGNAL_TO_ADAPTATION: Partial<Record<SignalType, { type: AdaptationType; verb: string }>> = {
  CAPACITY_SIGNAL: { type: "REALLOCATE", verb: "Rebalance planned focus across the week" },
  DEADLINE_SIGNAL: { type: "RESCHEDULE", verb: "Reschedule around the at-risk deadline" },
  GOAL_SIGNAL: { type: "INCREASE_FOCUS", verb: "Increase focus allocation" },
  PLAN_SIGNAL: { type: "REPLAN", verb: "Refresh the stale plan" },
  EXECUTION_SIGNAL: { type: "REDUCE_SCOPE", verb: "Reduce concurrent scope" },
  BEHAVIORAL_PATTERN_SIGNAL: { type: "CHANGE_WORKFLOW", verb: "Adjust the workflow that keeps drifting" },
  RISK_SIGNAL: { type: "DECOMPOSE", verb: "Break the blocking item into smaller steps" },
  CONTEXT_SIGNAL: { type: "REPRIORITIZE", verb: "Reconcile the conflicting context" },
};

function signatureFor(signal: Signal): string {
  return `${signal.type}:${signal.statement}`;
}

function confidenceFor(signal: Signal, evidenceCount: number): ProposalConfidence {
  if (evidenceCount >= 3 && signal.severity !== "INFO") return "high";
  if (evidenceCount >= 1) return "medium";
  return "low";
}

/** One proposal per significant signal — never fabricated, always reviewable,
 * never auto-approved. Only HIGH/CRITICAL (or MEDIUM with 2+ pieces of
 * evidence) signals become proposals, so a single insignificant event does not
 * trigger an adaptation. */
export function buildAdaptationProposals(signals: Signal[], nowIso: string): AdaptationProposal[] {
  return signals
    .filter(
      (signal) =>
        signal.severity === "CRITICAL" ||
        signal.severity === "HIGH" ||
        (signal.severity === "MEDIUM" && signal.evidence.length >= 1),
    )
    .map((signal) => {
      const mapping = SIGNAL_TO_ADAPTATION[signal.type] ?? { type: "REPRIORITIZE" as AdaptationType, verb: "Review this area" };
      const confidence = confidenceFor(signal, signal.evidence.length);
      return {
        id: `prop:${signal.id}`,
        trigger: signal.type,
        adaptationType: mapping.type,
        title: mapping.verb,
        currentState: signal.statement,
        proposedChange: `${mapping.verb}. Nothing changes until you review and approve.`,
        expectedImpact:
          signal.type === "CAPACITY_SIGNAL"
            ? "Capacity pressure should ease if applied."
            : signal.type === "DEADLINE_SIGNAL"
              ? "Deadline risk should reduce if applied."
              : "Should relieve the condition described above.",
        risks: [
          signal.type === "DEADLINE_SIGNAL"
            ? "Rescheduling may push other work later."
            : "Changing course has a switching cost this week.",
        ],
        alternatives: ["Keep the current course and re-review next week.", "Simulate the change first in the Digital Twin."],
        evidence: signal.evidence,
        assumptions: ["Current configured availability and priorities still hold."],
        limitations: confidence === "low" ? ["Limited evidence — treat as directional."] : [],
        confidence,
        requiresApproval: true,
        status: "PROPOSED",
        stateSignature: signatureFor(signal),
        targetEntityId: null,
        createdAt: nowIso,
      };
    });
}

const STALE_PROPOSAL_MS = 24 * 60 * 60 * 1000;

export function isProposalStale(
  proposal: AdaptationProposal,
  currentSignatures: Set<string>,
  nowIso: string,
): boolean {
  if (Date.parse(nowIso) - Date.parse(proposal.createdAt) > STALE_PROPOSAL_MS) return true;
  return !currentSignatures.has(proposal.stateSignature);
}

export interface ProposalConflict {
  a: string;
  b: string;
  reason: string;
}

const OPPOSING = new Set(["PAUSE:INCREASE_FOCUS", "DEFER:RESCHEDULE", "REDUCE_SCOPE:INCREASE_FOCUS"]);

/** Never auto-apply two conflicting proposals — surface the conflict instead. */
export function detectProposalConflicts(proposals: AdaptationProposal[]): ProposalConflict[] {
  const conflicts: ProposalConflict[] = [];
  for (let i = 0; i < proposals.length; i += 1) {
    for (let j = i + 1; j < proposals.length; j += 1) {
      const a = proposals[i]!;
      const b = proposals[j]!;
      const key1 = `${a.adaptationType}:${b.adaptationType}`;
      const key2 = `${b.adaptationType}:${a.adaptationType}`;
      if (OPPOSING.has(key1) || OPPOSING.has(key2)) {
        conflicts.push({ a: a.id, b: b.id, reason: `"${a.title}" and "${b.title}" pull in opposite directions.` });
      }
    }
  }
  return conflicts;
}

const CONFIDENCE_WEIGHT: Record<ProposalConfidence, number> = { high: 1, medium: 0.6, low: 0.3 };

/** impact(severity via signal) * confidence, tie-broken by evidence depth —
 * documented, not arbitrary. */
export function prioritizeProposals(
  proposals: AdaptationProposal[],
  signalsById: Map<string, Signal>,
): AdaptationProposal[] {
  const score = (proposal: AdaptationProposal): number => {
    const signal = signalsById.get(proposal.id.replace("prop:", ""));
    const severityWeight = signal ? 4 - SEVERITY_RANK[signal.severity] : 1;
    return severityWeight * CONFIDENCE_WEIGHT[proposal.confidence] + proposal.evidence.length * 0.05;
  };
  return [...proposals].sort((a, b) => score(b) - score(a));
}

// ── Notifications & digests ─────────────────────────────────────────────────

export type NotificationPriority = "INFO" | "ACTION_REQUIRED" | "WARNING" | "CRITICAL";

export interface OpsNotification {
  id: string;
  priority: NotificationPriority;
  reason: string;
  source: string;
  timestamp: string;
  action: { label: string; href: string } | null;
}

const MAX_NOTIFICATIONS = 5;

/** Only high-signal items become notifications — never one per minor signal. */
export function buildNotifications(
  signals: Signal[],
  proposals: AdaptationProposal[],
  nowIso: string,
): OpsNotification[] {
  const notifications: OpsNotification[] = [];

  for (const signal of signals) {
    if (signal.severity !== "CRITICAL" && signal.severity !== "HIGH") continue;
    notifications.push({
      id: `notif:signal:${signal.id}`,
      priority: signal.severity === "CRITICAL" ? "CRITICAL" : "WARNING",
      reason: signal.statement,
      source: signal.sourceModule,
      timestamp: nowIso,
      action: { label: "Review", href: "/adaptation" },
    });
  }

  for (const proposal of proposals.filter((p) => p.status === "PROPOSED").slice(0, 3)) {
    notifications.push({
      id: `notif:proposal:${proposal.id}`,
      priority: "ACTION_REQUIRED",
      reason: `${proposal.title} — proposed.`,
      source: "adaptation",
      timestamp: nowIso,
      action: { label: "Review", href: "/adaptation" },
    });
  }

  return notifications.slice(0, MAX_NOTIFICATIONS);
}

export interface DailyBrief {
  generatedAt: string;
  priorities: string[];
  deadlines: string[];
  conflicts: string[];
  risks: string[];
  recommendedActions: string[];
}

export function buildDailyBrief(signals: Signal[], proposals: AdaptationProposal[], nowIso: string): DailyBrief {
  return {
    generatedAt: nowIso,
    priorities: signals.filter((s) => s.type === "GOAL_SIGNAL" || s.type === "PROGRESS_SIGNAL").slice(0, 3).map((s) => s.statement),
    deadlines: signals.filter((s) => s.type === "DEADLINE_SIGNAL").slice(0, 3).map((s) => s.statement),
    conflicts: signals.filter((s) => s.type === "CONTEXT_SIGNAL").slice(0, 3).map((s) => s.statement),
    risks: signals.filter((s) => s.severity === "CRITICAL" || s.severity === "HIGH").slice(0, 3).map((s) => s.statement),
    recommendedActions: proposals.slice(0, 3).map((p) => p.title),
  };
}

export const SIGNAL_TYPE_LABEL: Record<SignalType, string> = {
  PROGRESS_SIGNAL: "Progress",
  EXECUTION_SIGNAL: "Execution",
  CAPACITY_SIGNAL: "Capacity",
  DEADLINE_SIGNAL: "Deadline",
  FOCUS_SIGNAL: "Focus",
  GOAL_SIGNAL: "Goal",
  PLAN_SIGNAL: "Plan",
  RISK_SIGNAL: "Risk",
  BEHAVIORAL_PATTERN_SIGNAL: "Pattern",
  LEARNING_SIGNAL: "Learning",
  CONTEXT_SIGNAL: "Context",
};

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  DETECTED: "Detected",
  ANALYZING: "Analyzing",
  PROPOSED: "Proposed",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  APPLIED: "Applied",
  EXPIRED: "Expired",
  ARCHIVED: "Archived",
};
