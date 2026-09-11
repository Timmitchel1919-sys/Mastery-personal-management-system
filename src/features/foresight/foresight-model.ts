import type { PlanHealthEntry, ProjectHealthEntry } from "@/features/adaptation";
import type { HistoricalCalibration } from "@/features/twin";
import type { GoalHealth, Scenario } from "@/features/strategy";
import type { PredictiveSignal } from "@/features/predictions";

/**
 * Layer U — Predictive Personal Operating System (pure core).
 *
 * This is a *synthesis and horizon layer*, not a new prediction engine — it
 * reuses Layer J's deterministic signals, Layer O's strategy scenarios, Layer Q's
 * digital-twin capacity + calibration, and Layer S's project/plan health, and
 * folds them into one horizon-bucketed, kind-labelled `Forecast[]`. Every
 * forecast is explicitly one of OBSERVED_FACT / PREDICTION / PROJECTION /
 * RECOMMENDATION — the four are never merged. Nothing here is fabricated:
 * confidence and evidence always trace back to the source signal.
 */

export type ForecastHorizon = "today" | "next-7-days" | "next-30-days" | "next-90-days" | "long-term";

export const HORIZON_LABEL: Record<ForecastHorizon, string> = {
  today: "Today",
  "next-7-days": "Next 7 days",
  "next-30-days": "Next 30 days",
  "next-90-days": "Next 90 days",
  "long-term": "Long term",
};

export type ForecastType =
  | "GOAL_TRAJECTORY"
  | "TASK_COMPLETION"
  | "PROJECT_COMPLETION"
  | "DEADLINE_RISK"
  | "CAPACITY_RISK"
  | "SCHEDULE_CONFLICT"
  | "FOCUS_LOAD"
  | "WORKLOAD"
  | "STRATEGIC";

export const FORECAST_TYPE_LABEL: Record<ForecastType, string> = {
  GOAL_TRAJECTORY: "Goal trajectory",
  TASK_COMPLETION: "Task completion",
  PROJECT_COMPLETION: "Project completion",
  DEADLINE_RISK: "Deadline risk",
  CAPACITY_RISK: "Capacity risk",
  SCHEDULE_CONFLICT: "Schedule conflict",
  FOCUS_LOAD: "Focus load",
  WORKLOAD: "Workload",
  STRATEGIC: "Strategic",
};

/** The mandatory distinction — never merged. */
export type ForecastKind = "OBSERVED_FACT" | "PREDICTION" | "PROJECTION" | "RECOMMENDATION";

export const FORECAST_KIND_LABEL: Record<ForecastKind, string> = {
  OBSERVED_FACT: "Observed fact",
  PREDICTION: "Prediction",
  PROJECTION: "Projection",
  RECOMMENDATION: "Recommendation",
};

export type ForecastConfidence = "low" | "medium" | "high";
export type ForecastImpact = "low" | "medium" | "high" | "critical";
export type ForecastStatus = "active" | "stale" | "expired";

export interface ForecastTarget {
  kind: "goal" | "project" | "plan" | "capacity" | "strategy" | "schedule";
  id: string | null;
  label: string;
}

export interface Forecast {
  id: string;
  type: ForecastType;
  horizon: ForecastHorizon;
  kind: ForecastKind;
  statement: string;
  evidence: string[];
  assumptions: string[];
  confidence: ForecastConfidence;
  impact: ForecastImpact;
  target: ForecastTarget;
  /** A separate, clearly-labelled recommendation — never folded into `statement`. */
  recommendation: string | null;
  createdAt: string;
  expiresAt: string;
  status: ForecastStatus;
}

const CONFIDENCE_RANK: Record<ForecastConfidence, number> = { high: 0, medium: 1, low: 2 };
const IMPACT_RANK: Record<ForecastImpact, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const HORIZON_URGENCY: Record<ForecastHorizon, number> = {
  today: 0,
  "next-7-days": 1,
  "next-30-days": 2,
  "next-90-days": 3,
  "long-term": 4,
};

function mapPredictionConfidence(confidence: PredictiveSignal["confidence"]): ForecastConfidence {
  if (confidence === "high") return "high";
  if (confidence === "moderate") return "medium";
  return "low";
}

function horizonForPrediction(signal: PredictiveSignal): ForecastHorizon {
  if (signal.category === "goal-trajectory" || signal.category === "goal-inactivity") {
    return signal.urgency === "critical" ? "next-7-days" : "next-30-days";
  }
  if (signal.category === "deadline-risk") {
    return signal.urgency === "critical" ? "next-7-days" : "next-30-days";
  }
  return "next-7-days"; // schedule-overload, habit-trajectory — this week's capacity
}

function impactForUrgency(urgency: PredictiveSignal["urgency"]): ForecastImpact {
  if (urgency === "critical") return "critical";
  if (urgency === "important") return "high";
  if (urgency === "opportunity") return "medium";
  return "low";
}

const PREDICTION_TYPE_MAP: Record<PredictiveSignal["category"], ForecastType> = {
  "goal-trajectory": "GOAL_TRAJECTORY",
  "goal-inactivity": "GOAL_TRAJECTORY",
  "deadline-risk": "DEADLINE_RISK",
  "schedule-overload": "CAPACITY_RISK",
  "habit-trajectory": "WORKLOAD",
};

function horizonExpiry(nowIso: string, horizon: ForecastHorizon): string {
  const days = { today: 1, "next-7-days": 7, "next-30-days": 30, "next-90-days": 90, "long-term": 180 }[horizon];
  return new Date(Date.parse(nowIso) + days * 86_400_000).toISOString();
}

function forecastFromPrediction(signal: PredictiveSignal, nowIso: string): Forecast {
  const horizon = horizonForPrediction(signal);
  return {
    id: `fc:prediction:${signal.id}`,
    type: PREDICTION_TYPE_MAP[signal.category],
    horizon,
    kind: "PREDICTION",
    statement: signal.prediction,
    evidence: signal.evidence,
    assumptions: ["Current execution rate and configured priorities continue."],
    confidence: mapPredictionConfidence(signal.confidence),
    impact: impactForUrgency(signal.urgency),
    target: { kind: signal.category.startsWith("goal") ? "goal" : "schedule", id: null, label: FORECAST_TYPE_LABEL[PREDICTION_TYPE_MAP[signal.category]] },
    recommendation: signal.recommendation ?? null,
    createdAt: nowIso,
    expiresAt: horizonExpiry(nowIso, horizon),
    status: "active",
  };
}

const SCENARIO_HORIZON: Record<Scenario["horizon"], ForecastHorizon> = {
  short: "next-7-days",
  medium: "next-30-days",
  long: "long-term",
  "limited-data": "long-term",
};

function forecastFromScenario(scenario: Scenario, nowIso: string): Forecast {
  const horizon = SCENARIO_HORIZON[scenario.horizon];
  const confidence: ForecastConfidence = scenario.horizon === "limited-data" ? "low" : "medium";
  return {
    id: `fc:scenario:${scenario.kind}`,
    type: "STRATEGIC",
    horizon,
    kind: "PROJECTION",
    statement: `${scenario.title}: ${scenario.description}`,
    evidence: scenario.implications,
    assumptions: ["Model output from Strategy's scenario engine, not a guaranteed outcome."],
    confidence,
    impact: "medium",
    target: { kind: "strategy", id: null, label: "Strategy" },
    recommendation: null,
    createdAt: nowIso,
    expiresAt: horizonExpiry(nowIso, horizon),
    status: "active",
  };
}

function forecastFromGoalHealth(goal: GoalHealth, nowIso: string): Forecast | null {
  if (goal.state !== "at-risk" && goal.state !== "stalled") return null;
  const horizon: ForecastHorizon = goal.state === "stalled" ? "next-30-days" : "next-7-days";
  return {
    id: `fc:goal:${goal.goalId}`,
    type: "GOAL_TRAJECTORY",
    horizon,
    kind: "PREDICTION",
    statement: `"${goal.goalTitle}" trajectory: ${goal.state.replace("-", " ")}.`,
    evidence: goal.reasons,
    assumptions: ["Based on current progress and pace; does not account for un-logged work."],
    confidence: goal.reasons.length >= 2 ? "medium" : "low",
    impact: goal.state === "stalled" ? "high" : "medium",
    target: { kind: "goal", id: goal.goalId, label: goal.goalTitle },
    recommendation: null,
    createdAt: nowIso,
    expiresAt: horizonExpiry(nowIso, horizon),
    status: "active",
  };
}

function forecastFromProjectHealth(project: ProjectHealthEntry, nowIso: string): Forecast | null {
  if (project.state !== "delayed" && project.state !== "blocked" && project.state !== "at-risk") return null;
  return {
    id: `fc:project:${project.projectId}`,
    type: "PROJECT_COMPLETION",
    horizon: "next-30-days",
    kind: "PREDICTION",
    statement: `Project completion is ${project.state.replace("-", " ")} (${project.taskCount} tracked task(s)).`,
    evidence: project.reasons,
    assumptions: ["Assumes remaining tasks take comparable effort to completed ones."],
    confidence: "medium",
    impact: project.state === "blocked" ? "high" : "medium",
    target: { kind: "project", id: project.projectId, label: `Project ${project.projectId}` },
    recommendation: null,
    createdAt: nowIso,
    expiresAt: horizonExpiry(nowIso, "next-30-days"),
    status: "active",
  };
}

function forecastFromPlanHealth(plan: PlanHealthEntry, nowIso: string): Forecast | null {
  if (plan.state !== "overloaded") return null;
  return {
    id: `fc:plan:${plan.planId}`,
    type: "WORKLOAD",
    horizon: "next-30-days",
    kind: "PREDICTION",
    statement: `"${plan.planTitle}" is likely to stay overloaded without a change.`,
    evidence: plan.reasons,
    assumptions: ["Assumes the same set of competing goals stays linked to this plan."],
    confidence: "medium",
    impact: "medium",
    target: { kind: "plan", id: plan.planId, label: plan.planTitle },
    recommendation: null,
    createdAt: nowIso,
    expiresAt: horizonExpiry(nowIso, "next-30-days"),
    status: "active",
  };
}

export interface CapacityForecastInput {
  overCommitted: boolean;
  plannedFocusHours: number;
  availableFocusHoursPerWeek: number;
}

function forecastFromCapacity(capacity: CapacityForecastInput, nowIso: string): Forecast | null {
  if (!capacity.overCommitted) return null;
  return {
    id: "fc:capacity",
    type: "CAPACITY_RISK",
    horizon: "next-7-days",
    kind: "PREDICTION",
    statement: "Planned focus for the coming week exceeds configured availability.",
    evidence: [`${capacity.plannedFocusHours}h/wk planned vs ${capacity.availableFocusHoursPerWeek}h/wk available.`],
    assumptions: ["Availability is the figure configured in the Digital Twin."],
    confidence: "high",
    impact: "high",
    target: { kind: "capacity", id: null, label: "Weekly capacity" },
    recommendation: "Reprioritize, reschedule, decompose, or defer some of the planned work.",
    createdAt: nowIso,
    expiresAt: horizonExpiry(nowIso, "next-7-days"),
    status: "active",
  };
}

function forecastFromCalibration(calibration: HistoricalCalibration, nowIso: string): Forecast | null {
  if (calibration.estimateOverrunFactor == null || calibration.estimateOverrunFactor < 1.2) return null;
  return {
    id: "fc:task-completion-bias",
    type: "TASK_COMPLETION",
    horizon: "next-30-days",
    kind: "PROJECTION",
    statement: `Task completion is likely to take ${calibration.estimateOverrunFactor}× longer than initially estimated.`,
    evidence: [`Based on ${calibration.sampleSize} completed task(s) with recorded estimates and actuals.`],
    assumptions: ["This pattern continues for upcoming tasks of similar size."],
    confidence: calibration.sampleSize >= 8 ? "medium" : "low",
    impact: "medium",
    target: { kind: "capacity", id: null, label: "Task estimation" },
    recommendation: "Add a buffer when estimating similar tasks.",
    createdAt: nowIso,
    expiresAt: horizonExpiry(nowIso, "next-30-days"),
    status: "active",
  };
}

export interface ForesightInput {
  nowIso?: string;
  predictions: { enabled: boolean; signals: PredictiveSignal[] } | null;
  scenarios: Scenario[];
  goalHealth: GoalHealth[];
  projectHealth: ProjectHealthEntry[];
  planHealth: PlanHealthEntry[];
  capacity: CapacityForecastInput | null;
  calibration: HistoricalCalibration | null;
  hasData: boolean;
}

/** Build the full, deduplicated, horizon-bucketed forecast set. Every entry
 * traces to an already-computed source — nothing is invented here. */
export function buildForecasts(input: ForesightInput): Forecast[] {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const forecasts: Forecast[] = [];
  const seen = new Set<string>();
  const push = (forecast: Forecast | null) => {
    if (!forecast) return;
    const key = `${forecast.type}::${forecast.statement}`;
    if (seen.has(key)) return;
    seen.add(key);
    forecasts.push(forecast);
  };

  if (input.predictions?.enabled) {
    for (const signal of input.predictions.signals) push(forecastFromPrediction(signal, nowIso));
  }
  for (const scenario of input.scenarios) push(forecastFromScenario(scenario, nowIso));
  for (const goal of input.goalHealth) push(forecastFromGoalHealth(goal, nowIso));
  for (const project of input.projectHealth) push(forecastFromProjectHealth(project, nowIso));
  for (const plan of input.planHealth) push(forecastFromPlanHealth(plan, nowIso));
  if (input.capacity) push(forecastFromCapacity(input.capacity, nowIso));
  if (input.calibration) push(forecastFromCalibration(input.calibration, nowIso));

  return forecasts.sort((a, b) => {
    const impact = IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact];
    if (impact !== 0) return impact;
    const horizon = HORIZON_URGENCY[a.horizon] - HORIZON_URGENCY[b.horizon];
    if (horizon !== 0) return horizon;
    return CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence];
  });
}

/** Mark forecasts whose horizon has expired, or whose underlying signal no
 * longer holds, as STALE rather than silently reusing them. */
export function refreshForecastStatus(forecasts: Forecast[], currentKeys: Set<string>, nowIso: string): Forecast[] {
  return forecasts.map((forecast) => {
    if (Date.parse(forecast.expiresAt) <= Date.parse(nowIso)) {
      return { ...forecast, status: "expired" as ForecastStatus };
    }
    const key = `${forecast.type}::${forecast.statement}`;
    if (!currentKeys.has(key)) return { ...forecast, status: "stale" as ForecastStatus };
    return forecast;
  });
}

// ── Early warnings ──────────────────────────────────────────────────────────

export type WarningKind =
  | "DEADLINE_APPROACHING"
  | "GOAL_TRAJECTORY_DECLINING"
  | "CAPACITY_OVERLOAD"
  | "PROJECT_BOTTLENECK"
  | "SCHEDULE_CONFLICT"
  | "STRATEGIC_STAGNATION";

export interface EarlyWarning {
  id: string;
  kind: WarningKind;
  forecastId: string;
  statement: string;
  action: { label: string; href: string };
}

const WARNING_KIND_BY_TYPE: Partial<Record<ForecastType, WarningKind>> = {
  DEADLINE_RISK: "DEADLINE_APPROACHING",
  GOAL_TRAJECTORY: "GOAL_TRAJECTORY_DECLINING",
  CAPACITY_RISK: "CAPACITY_OVERLOAD",
  PROJECT_COMPLETION: "PROJECT_BOTTLENECK",
  SCHEDULE_CONFLICT: "SCHEDULE_CONFLICT",
  STRATEGIC: "STRATEGIC_STAGNATION",
};

const ACTION_HREF: Record<WarningKind, { label: string; href: string }> = {
  DEADLINE_APPROACHING: { label: "Review tasks", href: "/act/tasks" },
  GOAL_TRAJECTORY_DECLINING: { label: "Review goal", href: "/plan/goals" },
  CAPACITY_OVERLOAD: { label: "Simulate a change", href: "/simulation" },
  PROJECT_BOTTLENECK: { label: "Review project", href: "/act/tasks" },
  SCHEDULE_CONFLICT: { label: "Review schedule", href: "/focus/calendar" },
  STRATEGIC_STAGNATION: { label: "Open Strategy", href: "/strategy" },
};

const MAX_WARNINGS = 6;

/** Only meaningful impact + confidence becomes a warning — never one per
 * insignificant forecast. Prioritised by impact, then horizon urgency, then
 * confidence — the same documented ordering `buildForecasts` already applies. */
export function buildEarlyWarnings(forecasts: Forecast[]): EarlyWarning[] {
  return forecasts
    .filter((forecast) => forecast.status === "active")
    .filter((forecast) => IMPACT_RANK[forecast.impact] <= IMPACT_RANK.high && forecast.confidence !== "low")
    .slice(0, MAX_WARNINGS)
    .map((forecast) => {
      const kind = WARNING_KIND_BY_TYPE[forecast.type] ?? "STRATEGIC_STAGNATION";
      return {
        id: `warn:${forecast.id}`,
        kind,
        forecastId: forecast.id,
        statement: forecast.statement,
        action: ACTION_HREF[kind],
      };
    });
}

// ── Future timeline ─────────────────────────────────────────────────────────

export type TimelineEntryKind = "ACTUAL" | "PREDICTED" | "PROJECTED";

export interface TimelineEntry {
  id: string;
  bucket: ForecastHorizon;
  kind: TimelineEntryKind;
  label: string;
  date: string | null;
}

const BUCKET_ORDER: ForecastHorizon[] = ["today", "next-7-days", "next-30-days", "next-90-days", "long-term"];

export interface ActualEvent {
  id: string;
  label: string;
  date: string;
}

/** Actual (confirmed) events are always visually and semantically distinct
 * from predicted/projected ones — never merged into one undifferentiated list
 * item type. */
export function buildFutureTimeline(forecasts: Forecast[], actualEvents: ActualEvent[], nowIso: string): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (const event of actualEvents) {
    const daysOut = Math.round((Date.parse(event.date) - Date.parse(nowIso)) / 86_400_000);
    const bucket: ForecastHorizon = daysOut <= 0 ? "today" : daysOut <= 7 ? "next-7-days" : daysOut <= 30 ? "next-30-days" : daysOut <= 90 ? "next-90-days" : "long-term";
    entries.push({ id: `tl:actual:${event.id}`, bucket, kind: "ACTUAL", label: event.label, date: event.date });
  }

  for (const forecast of forecasts.filter((f) => f.status === "active")) {
    entries.push({
      id: `tl:${forecast.id}`,
      bucket: forecast.horizon,
      kind: forecast.kind === "PROJECTION" ? "PROJECTED" : "PREDICTED",
      label: forecast.statement,
      date: null,
    });
  }

  return entries.sort((a, b) => BUCKET_ORDER.indexOf(a.bucket) - BUCKET_ORDER.indexOf(b.bucket));
}

// ── Calibration ─────────────────────────────────────────────────────────────

export type CalibrationVerdict = "CORRECT" | "PARTIALLY_CORRECT" | "INCORRECT" | "UNRESOLVED";

export interface CalibrationEntry {
  id: string;
  forecastId: string;
  forecastType: ForecastType;
  statement: string;
  predictedAt: string;
  verdict: CalibrationVerdict;
  note: string | null;
  evaluatedAt: string | null;
}

export interface CalibrationSummary {
  total: number;
  evaluated: number;
  correct: number;
  partiallyCorrect: number;
  incorrect: number;
  accuracyRate: number | null;
}

/** Never blindly increase confidence after repeated predictions — this only
 * ever reports the observed rate, it does not feed back into `buildForecasts`
 * automatically. */
export function summarizeCalibration(entries: CalibrationEntry[]): CalibrationSummary {
  const evaluated = entries.filter((entry) => entry.verdict !== "UNRESOLVED");
  const correct = evaluated.filter((entry) => entry.verdict === "CORRECT").length;
  const partiallyCorrect = evaluated.filter((entry) => entry.verdict === "PARTIALLY_CORRECT").length;
  const incorrect = evaluated.filter((entry) => entry.verdict === "INCORRECT").length;
  return {
    total: entries.length,
    evaluated: evaluated.length,
    correct,
    partiallyCorrect,
    incorrect,
    accuracyRate: evaluated.length === 0 ? null : Math.round(((correct + partiallyCorrect * 0.5) / evaluated.length) * 100) / 100,
  };
}
