import type { BrainModuleId } from "@/features/brain-hub/brain-modules";
import type { BrainSystemState } from "@/features/brain-hub/brain-state";
import type { DecisionRecord, DecisionStatus } from "@/features/decisions/schema";
import type {
  InsightConfidence,
  InsightSeverity,
  MasteryInsight,
} from "@/features/intelligence/mastery-intelligence";
import type {
  PredictionCategory,
  PredictionConfidence,
  PredictiveSignal,
} from "@/features/predictions/prediction-model";

/**
 * Layer N — Personal Command Center.
 *
 * A pure, deterministic reducer over state that other layers already derive
 * (intelligence, predictions, brain-system-state, decisions). It never queries a
 * repository, never calls an LLM, and never fabricates a fact: every field is a
 * projection of the inputs it is handed. The Command Center answers five
 * questions — what matters, what is happening, what is at risk, what needs a
 * decision, what to do next — and nothing more.
 */

export type CommandSeverity = "INFO" | "NOTICE" | "WARNING" | "CRITICAL";

export type CommandSource = BrainModuleId | "decisions" | "learning" | "system";

export type CommandMode =
  | "first-time"
  | "normal"
  | "busy"
  | "high-risk"
  | "no-data"
  | "degraded";

export interface CommandAction {
  label: string;
  href: string;
}

export interface AttentionItem {
  id: string;
  /** Machine-readable kind — `overdue-task`, `deadline-risk`, `plan-conflict`, … */
  type: string;
  title: string;
  /** Why this is surfaced — plain, grounded in the evidence. */
  reason: string;
  severity: CommandSeverity;
  sourceModule: CommandSource;
  action: CommandAction | null;
}

export interface DecisionQueueItem {
  id: string;
  title: string;
  context: string;
  status: DecisionStatus;
  affectedGoals: number;
  affectedPlans: number;
  relatedPredictions: number;
  dueDate: string | null;
  overdue: boolean;
  action: CommandAction;
}

export type RiskCategory =
  | "DEADLINE RISK"
  | "WORKLOAD RISK"
  | "PLAN CONFLICT"
  | "EXECUTION RISK"
  | "DECISION RISK"
  | "GOAL RISK";

export interface RiskItem {
  id: string;
  category: RiskCategory;
  explanation: string;
  evidence: string[];
  confidence: PredictionConfidence;
  area: CommandSource;
  action: CommandAction | null;
}

export interface ProgressMetric {
  id: string;
  label: string;
  /** `null` when the metric genuinely has no data — never a placeholder number. */
  value: number | null;
  kind: "percent" | "count";
  detail: string;
  href: string;
}

export interface AlignmentStep {
  label: string;
  value: string;
  href: string | null;
}

export interface AlignmentChain {
  id: string;
  steps: AlignmentStep[];
}

export interface NowContext {
  focus: string | null;
  activeTask: string | null;
  activeGoal: string | null;
  priority: string | null;
  deadline: string | null;
  alert: string | null;
  nextAction: CommandAction | null;
}

export interface TodayItem {
  id: string;
  label: string;
  kind: "priority" | "focus" | "task" | "deadline" | "decision" | "insight";
  href: string;
}

export interface ExecutiveBrief {
  /** "What matters most today?" */
  state: string;
  /** "What changed?" — null when nothing notable changed. */
  keyDevelopment: string | null;
  /** "What should you watch?" */
  risk: string;
  /** "What requires your judgment?" */
  decision: string;
  /** "What should you consider doing?" — null when there is no recommendation. */
  recommendation: string | null;
  /** "What has recently been learned?" — null when nothing has. */
  learning: string | null;
  grounded: true;
  source: "deterministic";
}

export interface CommandCenterState {
  generatedAt: string;
  mode: CommandMode;
  now: NowContext;
  today: TodayItem[];
  attention: AttentionItem[];
  decisions: DecisionQueueItem[];
  risk: RiskItem[];
  progress: ProgressMetric[];
  alignment: AlignmentChain[];
  brief: ExecutiveBrief;
  /** Human-readable labels for every input source that failed or is missing. */
  degraded: string[];
}

export interface IntelligenceProjection {
  status: "loading" | "ready" | "error";
  hasAnyData: boolean;
  insights: MasteryInsight[];
  today: MasteryInsight[];
  progress: MasteryInsight[];
  attention: MasteryInsight[];
  patterns: MasteryInsight[];
  recommendations: MasteryInsight[];
}

export interface PredictionProjection {
  status: "loading" | "ready" | "error";
  enabled: boolean;
  signals: PredictiveSignal[];
}

export interface CommandCenterInput {
  nowIso?: string;
  intelligence: IntelligenceProjection | null;
  predictions: PredictionProjection | null;
  brain: BrainSystemState | null;
  decisions: DecisionRecord[] | null;
}

const MODULE_LABEL: Record<BrainModuleId, string> = {
  goals: "Goals",
  plan: "Plan",
  focus: "Focus",
  act: "Act",
  grow: "Grow",
  analytics: "Analytics",
};

const MODULE_HREF: Record<BrainModuleId, string> = {
  goals: "/plan/goals",
  plan: "/plan",
  focus: "/focus",
  act: "/act",
  grow: "/grow",
  analytics: "/analytics",
};

const MODULE_IDS: BrainModuleId[] = ["goals", "plan", "focus", "act", "grow", "analytics"];

/** Decision statuses that still need the user's judgment. */
const OPEN_DECISION_STATUSES = new Set<DecisionStatus>(["DRAFT", "ANALYZING", "READY"]);

const SEVERITY_FROM_INSIGHT: Record<InsightSeverity, CommandSeverity> = {
  critical: "CRITICAL",
  high: "WARNING",
  medium: "NOTICE",
  low: "INFO",
  info: "INFO",
};

const SEVERITY_RANK: Record<CommandSeverity, number> = {
  CRITICAL: 0,
  WARNING: 1,
  NOTICE: 2,
  INFO: 3,
};

const PREDICTION_URGENCY_SEVERITY: Record<PredictiveSignal["urgency"], CommandSeverity> = {
  critical: "CRITICAL",
  important: "WARNING",
  opportunity: "NOTICE",
  information: "INFO",
};

const RISK_CATEGORY_FROM_PREDICTION: Record<PredictionCategory, RiskCategory> = {
  "deadline-risk": "DEADLINE RISK",
  "schedule-overload": "WORKLOAD RISK",
  "goal-trajectory": "GOAL RISK",
  "goal-inactivity": "GOAL RISK",
  "habit-trajectory": "EXECUTION RISK",
};

const RISK_AREA_FROM_PREDICTION: Record<PredictionCategory, CommandSource> = {
  "deadline-risk": "act",
  "schedule-overload": "focus",
  "goal-trajectory": "goals",
  "goal-inactivity": "goals",
  "habit-trajectory": "act",
};

function todayIso(nowIso: string): string {
  return nowIso.slice(0, 10);
}

function confidenceFromInsight(confidence: InsightConfidence): PredictionConfidence {
  if (confidence === "high") return "high";
  if (confidence === "medium") return "moderate";
  return "limited";
}

function firstAction(insight: MasteryInsight): CommandAction | null {
  const action = insight.actions[0];
  return action ? { label: action.label, href: action.href } : null;
}

function attentionFromInsight(insight: MasteryInsight): AttentionItem {
  return {
    id: `insight:${insight.id}`,
    type: insight.type,
    title: insight.title,
    reason: insight.summary,
    severity: SEVERITY_FROM_INSIGHT[insight.severity],
    sourceModule: insight.relatedModule === "global" ? "system" : insight.relatedModule,
    action: firstAction(insight),
  };
}

function attentionFromPrediction(signal: PredictiveSignal): AttentionItem {
  return {
    id: `prediction:${signal.id}`,
    type: signal.category,
    title: signal.prediction,
    reason: signal.evidence[0] ?? signal.recommendation ?? "Forward-looking signal from your data.",
    severity: PREDICTION_URGENCY_SEVERITY[signal.urgency],
    sourceModule: RISK_AREA_FROM_PREDICTION[signal.category],
    action: signal.action ? { label: signal.action.label, href: signal.action.href } : null,
  };
}

function buildAttention(input: CommandCenterInput): AttentionItem[] {
  const items: AttentionItem[] = [];
  const seen = new Set<string>();

  const push = (item: AttentionItem) => {
    const key = `${item.type}::${item.title}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
  };

  if (input.intelligence) {
    for (const insight of input.intelligence.attention) push(attentionFromInsight(insight));
    for (const insight of input.intelligence.insights) {
      if (insight.severity === "critical" || insight.severity === "high") {
        push(attentionFromInsight(insight));
      }
    }
  }

  if (input.predictions && input.predictions.enabled) {
    for (const signal of input.predictions.signals) {
      if (signal.urgency === "critical" || signal.urgency === "important") {
        push(attentionFromPrediction(signal));
      }
    }
  }

  if (input.brain && input.brain.availability === "ready") {
    for (const id of MODULE_IDS) {
      const visual = input.brain.modules[id];
      if (visual.status === "attention" && visual.attentionCount > 0) {
        push({
          id: `brain:${id}`,
          type: "module-attention",
          title: `${MODULE_LABEL[id]} needs review`,
          reason: `${visual.attentionCount} item${visual.attentionCount === 1 ? "" : "s"} in ${MODULE_LABEL[id]} flagged for attention.`,
          severity: "NOTICE",
          sourceModule: id,
          action: { label: `Open ${MODULE_LABEL[id]}`, href: MODULE_HREF[id] },
        });
      }
    }
  }

  const today = input.nowIso ? todayIso(input.nowIso) : new Date().toISOString().slice(0, 10);
  for (const decision of input.decisions ?? []) {
    if (!OPEN_DECISION_STATUSES.has(decision.status)) continue;
    if (!decision.dueDate || decision.dueDate >= today) continue;
    push({
      id: `decision:${decision.id}`,
      type: "decision-overdue",
      title: `Decision overdue — ${decision.title}`,
      reason: `This decision was due ${decision.dueDate} and is still ${decision.status.toLowerCase()}.`,
      severity: "WARNING",
      sourceModule: "decisions",
      action: { label: "Open decision", href: "/decisions" },
    });
  }

  return items.sort((a, b) => {
    const rank = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    return rank !== 0 ? rank : a.title.localeCompare(b.title);
  });
}

function buildDecisionQueue(input: CommandCenterInput): DecisionQueueItem[] {
  const today = input.nowIso ? todayIso(input.nowIso) : new Date().toISOString().slice(0, 10);
  return (input.decisions ?? [])
    .filter((decision) => OPEN_DECISION_STATUSES.has(decision.status))
    .map((decision) => ({
      id: decision.id,
      title: decision.title,
      context: decision.context,
      status: decision.status,
      affectedGoals: decision.relatedGoals.length,
      affectedPlans: decision.relatedPlans.length,
      relatedPredictions: decision.relatedPredictions.length,
      dueDate: decision.dueDate ?? null,
      overdue: decision.dueDate != null && decision.dueDate < today,
      action: { label: "Open decision", href: "/decisions" },
    }))
    .sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return a.title.localeCompare(b.title);
    });
}

function buildRisk(input: CommandCenterInput): RiskItem[] {
  const items: RiskItem[] = [];

  if (input.predictions && input.predictions.enabled) {
    for (const signal of input.predictions.signals) {
      items.push({
        id: `prediction:${signal.id}`,
        category: RISK_CATEGORY_FROM_PREDICTION[signal.category],
        explanation: signal.prediction,
        evidence: signal.evidence,
        confidence: signal.confidence,
        area: RISK_AREA_FROM_PREDICTION[signal.category],
        action: signal.action ? { label: signal.action.label, href: signal.action.href } : null,
      });
    }
  }

  if (input.intelligence) {
    for (const insight of input.intelligence.attention) {
      if (insight.relatedModule !== "plan") continue;
      if (insight.severity !== "critical" && insight.severity !== "high") continue;
      items.push({
        id: `insight:${insight.id}`,
        category: "PLAN CONFLICT",
        explanation: insight.title,
        evidence: insight.evidence.length > 0 ? insight.evidence : [insight.summary],
        confidence: confidenceFromInsight(insight.confidence),
        area: "plan",
        action: firstAction(insight),
      });
    }
  }

  const today = input.nowIso ? todayIso(input.nowIso) : new Date().toISOString().slice(0, 10);
  const overdueDecisions = (input.decisions ?? []).filter(
    (decision) =>
      OPEN_DECISION_STATUSES.has(decision.status) &&
      decision.dueDate != null &&
      decision.dueDate < today,
  );
  if (overdueDecisions.length > 0) {
    items.push({
      id: "decision-risk",
      category: "DECISION RISK",
      explanation: `${overdueDecisions.length} decision${overdueDecisions.length === 1 ? "" : "s"} past the date you set.`,
      evidence: overdueDecisions.slice(0, 3).map((d) => `${d.title} — due ${d.dueDate}`),
      confidence: "high",
      area: "decisions",
      action: { label: "Open decisions", href: "/decisions" },
    });
  }

  const order: RiskCategory[] = [
    "DEADLINE RISK",
    "PLAN CONFLICT",
    "WORKLOAD RISK",
    "EXECUTION RISK",
    "GOAL RISK",
    "DECISION RISK",
  ];
  return items.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
}

function buildProgress(input: CommandCenterInput): ProgressMetric[] {
  if (!input.brain || input.brain.availability !== "ready") return [];
  const metrics: ProgressMetric[] = [];
  for (const id of MODULE_IDS) {
    const visual = input.brain.modules[id];
    if (visual.progress !== null) {
      metrics.push({
        id: `progress:${id}`,
        label: MODULE_LABEL[id],
        value: visual.progress,
        kind: "percent",
        detail:
          visual.attentionCount > 0
            ? `${visual.attentionCount} need${visual.attentionCount === 1 ? "s" : ""} attention`
            : "on track",
        href: MODULE_HREF[id],
      });
    }
  }
  return metrics;
}

function buildAlignment(input: CommandCenterInput): AlignmentChain[] {
  if (!input.intelligence) return [];
  const chains: AlignmentChain[] = [];
  for (const insight of input.intelligence.recommendations) {
    if (insight.relatedModule === "global") continue;
    const action = firstAction(insight);
    const steps: AlignmentStep[] = [
      {
        label: "System",
        value: MODULE_LABEL[insight.relatedModule],
        href: MODULE_HREF[insight.relatedModule],
      },
      { label: "Current priority", value: insight.title, href: null },
    ];
    if (action) steps.push({ label: "Next action", value: action.label, href: action.href });
    chains.push({ id: `alignment:${insight.id}`, steps });
  }
  return chains;
}

function buildNow(
  input: CommandCenterInput,
  attention: AttentionItem[],
  risk: RiskItem[],
  decisions: DecisionQueueItem[],
): NowContext {
  const intelligence = input.intelligence;
  const brain = input.brain;

  const todayByModule = (module: BrainModuleId) =>
    intelligence?.today.find((insight) => insight.relatedModule === module) ??
    intelligence?.insights.find((insight) => insight.relatedModule === module) ??
    null;

  let focus: string | null = null;
  if (brain && brain.availability === "ready" && brain.modules.focus.status === "active") {
    focus = "Focus work in progress";
  } else {
    focus = todayByModule("focus")?.title ?? null;
  }

  const deadlineSignal = (input.predictions?.enabled ? input.predictions.signals : []).find(
    (signal) => signal.category === "deadline-risk",
  );

  const recommendation =
    intelligence?.recommendations[0] ?? intelligence?.today[0] ?? null;
  const nextAction =
    (recommendation ? firstAction(recommendation) : null) ??
    attention.find((item) => item.action)?.action ??
    (decisions[0] ? decisions[0].action : null) ??
    null;

  return {
    focus,
    activeTask: todayByModule("act")?.title ?? null,
    activeGoal: todayByModule("goals")?.title ?? null,
    priority: attention[0]?.title ?? null,
    deadline: deadlineSignal?.prediction ?? null,
    alert: attention.find((item) => item.severity === "CRITICAL")?.title ?? risk[0]?.explanation ?? null,
    nextAction,
  };
}

function buildToday(input: CommandCenterInput, decisions: DecisionQueueItem[]): TodayItem[] {
  const items: TodayItem[] = [];

  for (const insight of input.intelligence?.today ?? []) {
    const action = firstAction(insight);
    items.push({
      id: `today:${insight.id}`,
      label: insight.title,
      kind: insight.severity === "critical" || insight.severity === "high" ? "priority" : "insight",
      href: action?.href ?? "/hub",
    });
  }

  for (const signal of input.predictions?.enabled ? input.predictions?.signals ?? [] : []) {
    if (signal.category !== "deadline-risk") continue;
    items.push({
      id: `today:${signal.id}`,
      label: signal.prediction,
      kind: "deadline",
      href: signal.action?.href ?? "/act/tasks",
    });
  }

  for (const decision of decisions.slice(0, 3)) {
    items.push({
      id: `today:${decision.id}`,
      label: decision.title,
      kind: "decision",
      href: "/decisions",
    });
  }

  return items.slice(0, 8);
}

function buildBrief(
  mode: CommandMode,
  attention: AttentionItem[],
  risk: RiskItem[],
  decisions: DecisionQueueItem[],
  input: CommandCenterInput,
): ExecutiveBrief {
  const attentionCount = attention.length;
  const state =
    mode === "no-data"
      ? "MASTERY does not have enough history yet to brief you. Keep using the modules."
      : attentionCount === 0
        ? "Nothing is urgent right now. Steady execution on your active goals."
        : `${attentionCount} item${attentionCount === 1 ? "" : "s"} need${attentionCount === 1 ? "s" : ""} your attention today.`;

  const development =
    input.intelligence?.today[0]?.summary ??
    input.intelligence?.progress[0]?.summary ??
    null;

  const learning = input.intelligence?.patterns[0]?.summary ?? null;

  return {
    state,
    keyDevelopment: development,
    risk: risk[0] ? risk[0].explanation : "No elevated risks detected.",
    decision: decisions[0] ? decisions[0].title : "No decisions are waiting on you.",
    recommendation:
      input.intelligence?.recommendations[0]?.recommendation ??
      input.intelligence?.today[0]?.recommendation ??
      null,
    learning,
    grounded: true,
    source: "deterministic",
  };
}

function resolveMode(
  input: CommandCenterInput,
  attention: AttentionItem[],
  decisions: DecisionQueueItem[],
): CommandMode {
  const intelligenceError = input.intelligence?.status === "error";
  const brainDown = input.brain?.availability === "unavailable";
  const predictionsError = input.predictions?.status === "error";

  if ((intelligenceError && brainDown) || (intelligenceError && predictionsError && brainDown)) {
    return "degraded";
  }

  const hasIntelligenceData = input.intelligence?.hasAnyData ?? false;
  const hasDecisions = (input.decisions ?? []).length > 0;
  const brainReadyWithItems =
    input.brain?.availability === "ready" &&
    MODULE_IDS.some((id) => (input.brain?.modules[id].progress ?? 0) > 0);

  if (!hasIntelligenceData && !hasDecisions && !brainReadyWithItems && !intelligenceError) {
    return input.intelligence?.status === "loading" ? "normal" : "no-data";
  }

  if (attention.some((item) => item.severity === "CRITICAL")) return "high-risk";
  if (attention.length + decisions.length >= 5) return "busy";
  if (!hasIntelligenceData && !hasDecisions) return "first-time";
  return "normal";
}

/**
 * Fold every already-derived input into one Command Center view state. Pure and
 * synchronous — the same inputs always yield the same output.
 */
export function buildCommandCenter(input: CommandCenterInput): CommandCenterState {
  const nowIso = input.nowIso ?? new Date().toISOString();

  const attention = buildAttention(input);
  const decisions = buildDecisionQueue(input);
  const risk = buildRisk(input);
  const progress = buildProgress(input);
  const alignment = buildAlignment(input);
  const now = buildNow(input, attention, risk, decisions);
  const today = buildToday(input, decisions);
  const mode = resolveMode(input, attention, decisions);
  const brief = buildBrief(mode, attention, risk, decisions, input);

  const degraded: string[] = [];
  if (!input.intelligence || input.intelligence.status === "error") {
    degraded.push("Intelligence unavailable — showing deterministic data only.");
  }
  if (!input.predictions || input.predictions.status === "error") {
    degraded.push("Predictions unavailable.");
  } else if (!input.predictions.enabled) {
    degraded.push("Predictions are turned off in your settings.");
  }
  if (!input.brain || input.brain.availability === "unavailable") {
    degraded.push("System status unavailable — the brain shows a neutral state.");
  }

  return {
    generatedAt: nowIso,
    mode,
    now,
    today,
    attention,
    decisions,
    risk,
    progress,
    alignment,
    brief,
    degraded,
  };
}

export const COMMAND_SEVERITY_LABEL: Record<CommandSeverity, string> = {
  INFO: "Info",
  NOTICE: "Notice",
  WARNING: "Warning",
  CRITICAL: "Critical",
};

export function isEmptyCommandCenter(state: CommandCenterState): boolean {
  return (
    state.attention.length === 0 &&
    state.decisions.length === 0 &&
    state.risk.length === 0 &&
    state.today.length === 0 &&
    state.progress.length === 0 &&
    state.alignment.length === 0
  );
}
