import type { DecisionRecord, DecisionStatus } from "@/features/decisions/schema";
import type { Goal } from "@/features/goals/schema";
import type { Plan } from "@/features/plans/schema";
import type { PredictiveSignal } from "@/features/predictions/prediction-model";
import type { Task } from "@/features/tasks/schema";

/**
 * Layer Q — Personal Digital Twin & Simulation Engine (pure core).
 *
 * The twin is a structured computational representation of the user's operational
 * state — goals, plans, tasks, schedule, capacity, deadlines, decisions — built
 * by reference from data the earlier layers already load. It is a sandbox: it
 * simulates hypothetical changes deterministically and shows potential
 * consequences, clearly separating FACT / ESTIMATE / PROJECTION / ASSUMPTION. It
 * never mutates real MASTERY state — applying a scenario is a separate, explicit,
 * confirmed step handled by the caller.
 */

export type ValueKind = "fact" | "estimate" | "projection" | "assumption";
export type SimHorizon = "1w" | "1m" | "3m" | "6m" | "12m";
export type SimConfidence = "high" | "medium" | "low" | "insufficient-data";

export type ScenarioOp =
  | "ADD"
  | "REMOVE"
  | "DEFER"
  | "ACCELERATE"
  | "REDUCE"
  | "RESCHEDULE"
  | "REPRIORITIZE"
  | "PAUSE"
  | "COMPLETE";

export type ScenarioStatus = "DRAFT" | "SIMULATED" | "REVIEWED" | "APPLIED" | "DISMISSED" | "ARCHIVED";

export interface Metric {
  key: string;
  label: string;
  value: number;
  unit: string;
  kind: ValueKind;
}

export interface CapacityModel {
  /** Editable assumption — MASTERY does not measure this. */
  availableFocusHoursPerWeek: number;
  /** Estimated from open task estimates. */
  plannedFocusHours: number;
  unallocatedFocusHours: number;
  overCommitted: boolean;
}

export interface DigitalTwinState {
  generatedAt: string;
  activeGoals: number;
  activeProjects: number;
  scheduledFocusHours: number;
  upcomingDeadlines: number;
  blockedItems: number;
  openDecisions: number;
  avgGoalProgress: number | null;
  capacity: CapacityModel;
  /** Every headline number tagged fact / estimate / projection / assumption. */
  metrics: Metric[];
  hasData: boolean;
}

export interface ScenarioChange {
  id: string;
  op: ScenarioOp;
  targetKind: "goal" | "plan" | "project" | "task" | "commitment" | "deadline";
  targetId?: string;
  targetLabel: string;
  /** e.g. { hours: 5 } for ADD, { days: 14 } for DEFER, { pct: 20 } for ACCELERATE. */
  params: Record<string, number>;
}

export interface Assumption {
  id: string;
  key: string;
  label: string;
  value: number;
  unit: string;
  kind: ValueKind;
  editable: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  horizon: SimHorizon;
  changes: ScenarioChange[];
  assumptions: Assumption[];
  status: ScenarioStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SimulationResult {
  scenarioId: string;
  scenarioName: string;
  horizon: SimHorizon;
  baseline: Metric[];
  projected: Metric[];
  changes: string[];
  affectedAreas: string[];
  outcomes: string[];
  risks: string[];
  tradeOffs: string[];
  assumptions: Assumption[];
  confidence: SimConfidence;
  limitations: string[];
}

export interface HistoricalCalibration {
  /** Historical mean actual minutes / mean estimated minutes across done tasks. */
  estimateOverrunFactor: number | null;
  sampleSize: number;
}

export interface TwinInput {
  nowIso?: string;
  goals: Goal[];
  plans: Plan[];
  tasks: Task[];
  predictions: { enabled: boolean; status: "loading" | "ready" | "error"; signals: PredictiveSignal[] } | null;
  decisions: DecisionRecord[] | null;
  /** Editable — the only "capacity" input, and it is explicitly an assumption. */
  availableFocusHoursPerWeek?: number;
}

const DEFAULT_WEEKLY_HOURS = 20;
const OPEN_DECISION_STATUSES = new Set<DecisionStatus>(["DRAFT", "ANALYZING", "READY"]);

const HORIZON_WEEKS: Record<SimHorizon, number> = {
  "1w": 1,
  "1m": 4,
  "3m": 13,
  "6m": 26,
  "12m": 52,
};

export const HORIZON_LABEL: Record<SimHorizon, string> = {
  "1w": "1 week",
  "1m": "1 month",
  "3m": "3 months",
  "6m": "6 months",
  "12m": "12 months",
};

function activeGoals(goals: Goal[]): Goal[] {
  return goals.filter((goal) => goal.goalStatus === "in-progress" || goal.goalStatus === "not-started");
}

function openTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.taskStatus !== "done" && task.taskStatus !== "cancelled");
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Compare done tasks' actual vs estimated minutes to see whether estimates
 * historically run over. Never concludes *why*. */
export function calibrateFromHistory(tasks: Task[]): HistoricalCalibration {
  const done = tasks.filter(
    (task) => task.taskStatus === "done" && task.estimatedMinutes > 0 && task.actualMinutes > 0,
  );
  if (done.length < 3) return { estimateOverrunFactor: null, sampleSize: done.length };
  const estimated = done.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const actual = done.reduce((sum, task) => sum + task.actualMinutes, 0);
  return { estimateOverrunFactor: round1(actual / estimated), sampleSize: done.length };
}

export function buildBaseline(input: TwinInput): DigitalTwinState {
  const now = input.nowIso ?? new Date().toISOString();
  const today = now.slice(0, 10);
  const goalsActive = activeGoals(input.goals);
  const projects = input.plans.filter((plan) => plan.planStatus === "active");
  const tasksOpen = openTasks(input.tasks);

  const plannedMinutes = tasksOpen.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0);
  const plannedFocusHours = round1(plannedMinutes / 60);

  const upcomingDeadlines =
    tasksOpen.filter((task) => task.dueDate != null && task.dueDate >= today).length +
    goalsActive.filter((goal) => goal.targetDate != null && goal.targetDate >= today).length;

  const blockedItems = tasksOpen.filter((task) => task.taskStatus === "blocked").length;

  const openDecisions = (input.decisions ?? []).filter((decision) =>
    OPEN_DECISION_STATUSES.has(decision.status),
  ).length;

  const progresses = goalsActive.map((goal) => goal.progress);
  const avgGoalProgress =
    progresses.length === 0
      ? null
      : Math.round(progresses.reduce((sum, value) => sum + value, 0) / progresses.length);

  const availableFocusHoursPerWeek = input.availableFocusHoursPerWeek ?? DEFAULT_WEEKLY_HOURS;
  const unallocatedFocusHours = round1(availableFocusHoursPerWeek - plannedFocusHours);

  const capacity: CapacityModel = {
    availableFocusHoursPerWeek,
    plannedFocusHours,
    unallocatedFocusHours,
    overCommitted: plannedFocusHours > availableFocusHoursPerWeek,
  };

  const scheduledFocusHours = plannedFocusHours;
  const hasData = input.goals.length > 0 || input.plans.length > 0 || input.tasks.length > 0;

  const metrics: Metric[] = [
    { key: "activeGoals", label: "Active goals", value: goalsActive.length, unit: "", kind: "fact" },
    { key: "activeProjects", label: "Active projects", value: projects.length, unit: "", kind: "fact" },
    {
      key: "scheduledFocusHours",
      label: "Planned focus",
      value: scheduledFocusHours,
      unit: "h/wk",
      kind: "estimate",
    },
    { key: "upcomingDeadlines", label: "Upcoming deadlines", value: upcomingDeadlines, unit: "", kind: "fact" },
    { key: "blockedItems", label: "Blocked items", value: blockedItems, unit: "", kind: "fact" },
    {
      key: "availableFocusHours",
      label: "Configured availability",
      value: availableFocusHoursPerWeek,
      unit: "h/wk",
      kind: "assumption",
    },
    {
      key: "unallocatedFocusHours",
      label: "Unallocated capacity",
      value: unallocatedFocusHours,
      unit: "h/wk",
      kind: "estimate",
    },
    {
      key: "avgGoalProgress",
      label: "Avg goal progress",
      value: avgGoalProgress ?? 0,
      unit: "%",
      kind: avgGoalProgress === null ? "assumption" : "estimate",
    },
  ];

  return {
    generatedAt: now,
    activeGoals: goalsActive.length,
    activeProjects: projects.length,
    scheduledFocusHours,
    upcomingDeadlines,
    blockedItems,
    openDecisions,
    avgGoalProgress,
    capacity,
    metrics,
    hasData,
  };
}

function assumptionValue(scenario: Scenario, key: string, fallback: number): number {
  return scenario.assumptions.find((assumption) => assumption.key === key)?.value ?? fallback;
}

/** Default, fully-editable assumption set for a new scenario. When a historical
 * calibration is available its overrun factor seeds the (still editable)
 * estimate-to-actual assumption, so the user sees it and can override it. */
export function defaultAssumptions(
  baseline: DigitalTwinState,
  calibration?: HistoricalCalibration,
): Assumption[] {
  const seededOverrun = calibration?.estimateOverrunFactor ?? 1;
  return [
    {
      id: "assume-hours",
      key: "availableFocusHoursPerWeek",
      label: "Available focus hours per week",
      value: baseline.capacity.availableFocusHoursPerWeek,
      unit: "h/wk",
      kind: "assumption",
      editable: true,
    },
    {
      id: "assume-overrun",
      key: "estimateOverrunFactor",
      label: "Estimate-to-actual factor",
      value: seededOverrun,
      unit: "×",
      kind: calibration?.estimateOverrunFactor != null ? "estimate" : "assumption",
      editable: true,
    },
    {
      id: "assume-weekly-progress",
      key: "weeklyProgressPerFocusHour",
      label: "Goal progress gained per focus hour",
      value: 1.5,
      unit: "%/h",
      kind: "assumption",
      editable: true,
    },
  ];
}

function metricSet(entries: Array<[string, string, number, string, ValueKind]>): Metric[] {
  return entries.map(([key, label, value, unit, kind]) => ({ key, label, value: round1(value), unit, kind }));
}

/**
 * Deterministic simulation. Applies each scenario change to a copy of the
 * baseline metric set and reports the projected values plus outcomes, risks and
 * trade-offs. Every projected number is tagged `projection`; nothing here touches
 * real data.
 */
export function runSimulation(
  baseline: DigitalTwinState,
  scenario: Scenario,
  calibration?: HistoricalCalibration,
): SimulationResult {
  const horizonWeeks = HORIZON_WEEKS[scenario.horizon];
  const availableHours = assumptionValue(
    scenario,
    "availableFocusHoursPerWeek",
    baseline.capacity.availableFocusHoursPerWeek,
  );
  const overrun = assumptionValue(scenario, "estimateOverrunFactor", calibration?.estimateOverrunFactor ?? 1);
  const progressPerHour = assumptionValue(scenario, "weeklyProgressPerFocusHour", 1.5);

  let plannedHours = baseline.capacity.plannedFocusHours * overrun;
  let goals = baseline.activeGoals;
  let projects = baseline.activeProjects;
  let deadlines = baseline.upcomingDeadlines;
  let deadlinePressure = baseline.upcomingDeadlines;
  let progress = baseline.avgGoalProgress ?? 0;
  let addedFocusHours = 0;

  const changeLines: string[] = [];
  const affected = new Set<string>();
  const risks: string[] = [];
  const tradeOffs: string[] = [];

  for (const change of scenario.changes) {
    affected.add(change.targetKind.toUpperCase());
    switch (change.op) {
      case "ADD": {
        const hours = change.params.hours ?? 0;
        plannedHours += hours;
        if (change.targetKind === "project" || change.targetKind === "plan") projects += 1;
        changeLines.push(`Add "${change.targetLabel}" (+${hours}h/wk planned).`);
        break;
      }
      case "REMOVE":
      case "PAUSE": {
        const hours = change.params.hours ?? 0;
        plannedHours = Math.max(0, plannedHours - hours);
        if (change.op === "REMOVE" && (change.targetKind === "project" || change.targetKind === "plan")) {
          projects = Math.max(0, projects - 1);
        }
        changeLines.push(`${change.op === "PAUSE" ? "Pause" : "Remove"} "${change.targetLabel}" (−${hours}h/wk planned).`);
        break;
      }
      case "REDUCE": {
        const hours = change.params.hours ?? 0;
        plannedHours = Math.max(0, plannedHours - hours);
        changeLines.push(`Reduce "${change.targetLabel}" by ${hours}h/wk.`);
        break;
      }
      case "ACCELERATE": {
        const hours = change.params.hours ?? 3;
        addedFocusHours += hours;
        plannedHours += hours;
        changeLines.push(`Accelerate "${change.targetLabel}" (+${hours}h/wk focus).`);
        break;
      }
      case "DEFER":
      case "RESCHEDULE": {
        const days = change.params.days ?? 14;
        deadlinePressure = Math.max(0, deadlinePressure - 1);
        changeLines.push(`${change.op === "DEFER" ? "Defer" : "Reschedule"} "${change.targetLabel}" by ${days} day(s).`);
        break;
      }
      case "REPRIORITIZE": {
        changeLines.push(`Reprioritise "${change.targetLabel}".`);
        break;
      }
      case "COMPLETE": {
        const hours = change.params.hours ?? 0;
        plannedHours = Math.max(0, plannedHours - hours);
        deadlines = Math.max(0, deadlines - 1);
        deadlinePressure = Math.max(0, deadlinePressure - 1);
        if (change.targetKind === "goal") {
          goals = Math.max(0, goals - 1);
          progress = Math.min(100, progress + 10);
        }
        changeLines.push(`Mark "${change.targetLabel}" complete.`);
        break;
      }
    }
  }

  const unallocated = round1(availableHours - plannedHours);
  const overCommitted = plannedHours > availableHours;
  const projectedProgress = Math.min(
    100,
    round1(progress + (addedFocusHours * progressPerHour * Math.min(horizonWeeks, 8)) / 4),
  );

  if (overCommitted) {
    risks.push(
      `Planned focus (${round1(plannedHours)}h/wk) exceeds configured availability (${availableHours}h/wk).`,
    );
  }
  if (addedFocusHours > 0 && unallocated < 0) {
    tradeOffs.push("The added focus has to come from somewhere — other work slows proportionally.");
  }
  if (scenario.changes.some((c) => c.op === "DEFER" || c.op === "RESCHEDULE")) {
    tradeOffs.push("Deferring reduces near-term pressure but the work still lands later.");
  }
  if (scenario.changes.some((c) => c.op === "ADD")) {
    risks.push("Adding commitments lowers the margin for the unexpected.");
  }

  const outcomes: string[] = [];
  if (addedFocusHours > 0) {
    outcomes.push(
      `Avg goal progress could move from ${round1(progress)}% toward ${projectedProgress}% over ${HORIZON_LABEL[scenario.horizon]} (projection).`,
    );
  }
  if (deadlinePressure < baseline.upcomingDeadlines) {
    outcomes.push(`Near-term deadline pressure eases (${baseline.upcomingDeadlines} → ${deadlinePressure}).`);
  }
  if (!overCommitted && unallocated > baseline.capacity.unallocatedFocusHours) {
    outcomes.push(`Unallocated capacity rises to ~${unallocated}h/wk.`);
  }
  if (outcomes.length === 0) {
    outcomes.push("No material change to the headline metrics from this scenario.");
  }

  const dataThin = !baseline.hasData || scenario.changes.length === 0;
  const calibrated = calibration && calibration.estimateOverrunFactor !== null;
  const confidence: SimConfidence = dataThin
    ? "insufficient-data"
    : calibrated && scenario.changes.length <= 3
      ? "medium"
      : "low";

  const limitations: string[] = [];
  if (dataThin) limitations.push("Insufficient data for reliable simulation.");
  if (!calibrated) {
    limitations.push("No historical execution calibration yet — the estimate-to-actual factor is assumed.");
  }
  limitations.push("Capacity is modelled from an editable weekly-hours assumption, not measured.");
  if (horizonWeeks > 13) limitations.push("Projection confidence is limited beyond ~3 months of history.");

  const baselineMetrics = metricSet([
    ["activeGoals", "Active goals", baseline.activeGoals, "", "fact"],
    ["activeProjects", "Active projects", baseline.activeProjects, "", "fact"],
    ["plannedFocusHours", "Planned focus", baseline.capacity.plannedFocusHours, "h/wk", "estimate"],
    ["unallocatedFocusHours", "Unallocated capacity", baseline.capacity.unallocatedFocusHours, "h/wk", "estimate"],
    ["upcomingDeadlines", "Upcoming deadlines", baseline.upcomingDeadlines, "", "fact"],
    ["avgGoalProgress", "Avg goal progress", baseline.avgGoalProgress ?? 0, "%", "estimate"],
  ]);

  const projectedMetrics = metricSet([
    ["activeGoals", "Active goals", goals, "", "projection"],
    ["activeProjects", "Active projects", projects, "", "projection"],
    ["plannedFocusHours", "Planned focus", plannedHours, "h/wk", "projection"],
    ["unallocatedFocusHours", "Unallocated capacity", unallocated, "h/wk", "projection"],
    ["upcomingDeadlines", "Upcoming deadlines", deadlines, "", "projection"],
    ["avgGoalProgress", "Avg goal progress", addedFocusHours > 0 ? projectedProgress : progress, "%", "projection"],
  ]);

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    horizon: scenario.horizon,
    baseline: baselineMetrics,
    projected: projectedMetrics,
    changes: changeLines.length > 0 ? changeLines : ["No changes defined."],
    affectedAreas: [...affected],
    outcomes,
    risks,
    tradeOffs,
    assumptions: scenario.assumptions,
    confidence,
    limitations,
  };
}

export interface ComparisonRow {
  key: string;
  label: string;
  unit: string;
  baseline: number;
  scenarios: Array<{ scenarioId: string; scenarioName: string; value: number; delta: number }>;
}

/** Build a comparison table across the baseline and any number of results.
 * Only metrics present in every result are included. */
export function compareScenarios(results: SimulationResult[]): ComparisonRow[] {
  if (results.length === 0) return [];
  const first = results[0]!;
  return first.baseline.map((baseMetric) => ({
    key: baseMetric.key,
    label: baseMetric.label,
    unit: baseMetric.unit,
    baseline: baseMetric.value,
    scenarios: results.map((result) => {
      const projected = result.projected.find((metric) => metric.key === baseMetric.key)?.value ?? baseMetric.value;
      return {
        scenarioId: result.scenarioId,
        scenarioName: result.scenarioName,
        value: projected,
        delta: round1(projected - baseMetric.value),
      };
    }),
  }));
}

export interface ApplyPreview {
  willModify: { goals: number; plans: number; tasks: number; deadlines: number };
  steps: string[];
  note: string;
}

/** The confirmation summary shown before applying a scenario. It does NOT mutate
 * anything — it describes what applying *would* do. Real application must go
 * through the existing per-domain mutation + authorization services. */
export function buildApplyPreview(scenario: Scenario): ApplyPreview {
  const counts = { goals: 0, plans: 0, tasks: 0, deadlines: 0 };
  const steps: string[] = [];
  for (const change of scenario.changes) {
    if (change.targetKind === "goal") counts.goals += 1;
    else if (change.targetKind === "plan" || change.targetKind === "project") counts.plans += 1;
    else if (change.targetKind === "task" || change.targetKind === "commitment") counts.tasks += 1;
    else if (change.targetKind === "deadline") counts.deadlines += 1;
    steps.push(`${change.op} → ${change.targetKind} "${change.targetLabel}"`);
  }
  return {
    willModify: counts,
    steps,
    note: "Applying is a separate, explicit step. Review each change; nothing is modified until you confirm.",
  };
}

export const VALUE_KIND_LABEL: Record<ValueKind, string> = {
  fact: "Fact",
  estimate: "Estimate",
  projection: "Projection",
  assumption: "Assumption",
};

export const SIM_CONFIDENCE_LABEL: Record<SimConfidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  "insufficient-data": "Insufficient data",
};
