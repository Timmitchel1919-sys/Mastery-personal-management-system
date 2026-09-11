import type { ActionSource } from "@/features/actions";

/**
 * Layer R — Autonomous Personal Operations (pure core).
 *
 * A deterministic policy + lifecycle + safety engine that lets MASTERY *act*,
 * never carelessly. Every action is classified by risk, evaluated against an
 * explicit user policy (ALLOW / DENY / REQUIRE_APPROVAL), run through a verified
 * lifecycle, and recorded. Authorization is always explicit — it is never
 * inferred from behaviour. Consequential and prohibited actions can never be
 * executed autonomously. This module holds no I/O and mutates no domain data;
 * `runOpsAction` only simulates the safe, internal action types.
 */

export type AutonomyLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface AutonomyLevelMeta {
  level: AutonomyLevel;
  key: string;
  label: string;
  description: string;
}

export const AUTONOMY_LEVEL_META: Record<AutonomyLevel, AutonomyLevelMeta> = {
  0: { level: 0, key: "OBSERVE", label: "Observe", description: "Read only. MASTERY never acts." },
  1: { level: 1, key: "RECOMMEND", label: "Recommend", description: "Suggests actions; you do them." },
  2: {
    level: 2,
    key: "PREPARE",
    label: "Prepare",
    description: "Prepares an action (draft, plan) without executing it.",
  },
  3: {
    level: 3,
    key: "EXECUTE_LOW_RISK",
    label: "Execute low-risk",
    description: "Executes explicitly permitted low-risk internal actions.",
  },
  4: {
    level: 4,
    key: "APPROVAL_REQUIRED",
    label: "Approval required",
    description: "Prepares the action and always asks you first.",
  },
  5: { level: 5, key: "PROHIBITED", label: "Prohibited", description: "Never executes anything." },
};

export type OpsRiskLevel = "low" | "medium" | "high" | "critical";

export const RISK_RANK: Record<OpsRiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 };

export type OpsCapability =
  | "READ"
  | "SUMMARIZE"
  | "PREPARE_DRAFT"
  | "PREPARE_PLAN"
  | "CREATE_INTERNAL_REMINDER"
  | "RECALCULATE_ANALYTICS"
  | "CLASSIFY_ITEMS"
  | "UPDATE_TASK_STATUS"
  | "EXTERNAL_COMMS"
  | "FINANCIAL"
  | "DESTRUCTIVE"
  | "SECURITY";

export type OpsActionType =
  // low-risk, internal, potentially automatable
  | "SUMMARIZE_TODAY"
  | "PREPARE_BRIEFING"
  | "PREPARE_WEEKLY_REVIEW"
  | "PREPARE_PLAN_DRAFT"
  | "CREATE_INTERNAL_REMINDER"
  | "RECALCULATE_ANALYTICS"
  | "CLASSIFY_INBOX"
  // medium-risk, internal, needs permission
  | "UPDATE_TASK_STATUS_VERIFIED"
  | "RESCHEDULE_FOCUS_BLOCK"
  // consequential — approval required, never auto
  | "SEND_EXTERNAL_MESSAGE"
  | "MODIFY_STRATEGIC_GOAL"
  // prohibited — never executed autonomously
  | "MOVE_MONEY"
  | "DELETE_GOAL"
  | "DELETE_PROJECT"
  | "CHANGE_SECURITY_SETTINGS"
  | "CHANGE_AUTHENTICATION"
  | "LEGAL_COMMITMENT"
  | "MEDICAL_DECISION";

export interface ActionCatalogEntry {
  type: OpsActionType;
  label: string;
  defaultRisk: OpsRiskLevel;
  requiredCapability: OpsCapability;
  reversible: boolean;
  /** True → can never be executed autonomously, regardless of policy. */
  prohibited: boolean;
  /** True → the deterministic engine can actually run it (internal, safe). */
  internallyExecutable: boolean;
}

export const ACTION_CATALOG: Record<OpsActionType, ActionCatalogEntry> = {
  SUMMARIZE_TODAY: { type: "SUMMARIZE_TODAY", label: "Summarise today", defaultRisk: "low", requiredCapability: "SUMMARIZE", reversible: true, prohibited: false, internallyExecutable: true },
  PREPARE_BRIEFING: { type: "PREPARE_BRIEFING", label: "Prepare briefing", defaultRisk: "low", requiredCapability: "SUMMARIZE", reversible: true, prohibited: false, internallyExecutable: true },
  PREPARE_WEEKLY_REVIEW: { type: "PREPARE_WEEKLY_REVIEW", label: "Prepare weekly review", defaultRisk: "low", requiredCapability: "PREPARE_DRAFT", reversible: true, prohibited: false, internallyExecutable: true },
  PREPARE_PLAN_DRAFT: { type: "PREPARE_PLAN_DRAFT", label: "Prepare a plan draft", defaultRisk: "low", requiredCapability: "PREPARE_PLAN", reversible: true, prohibited: false, internallyExecutable: true },
  CREATE_INTERNAL_REMINDER: { type: "CREATE_INTERNAL_REMINDER", label: "Create an internal reminder", defaultRisk: "low", requiredCapability: "CREATE_INTERNAL_REMINDER", reversible: true, prohibited: false, internallyExecutable: true },
  RECALCULATE_ANALYTICS: { type: "RECALCULATE_ANALYTICS", label: "Recalculate analytics", defaultRisk: "low", requiredCapability: "RECALCULATE_ANALYTICS", reversible: true, prohibited: false, internallyExecutable: true },
  CLASSIFY_INBOX: { type: "CLASSIFY_INBOX", label: "Classify existing items", defaultRisk: "low", requiredCapability: "CLASSIFY_ITEMS", reversible: true, prohibited: false, internallyExecutable: true },
  UPDATE_TASK_STATUS_VERIFIED: { type: "UPDATE_TASK_STATUS_VERIFIED", label: "Update task status after verified completion", defaultRisk: "medium", requiredCapability: "UPDATE_TASK_STATUS", reversible: true, prohibited: false, internallyExecutable: false },
  RESCHEDULE_FOCUS_BLOCK: { type: "RESCHEDULE_FOCUS_BLOCK", label: "Reschedule a focus block", defaultRisk: "medium", requiredCapability: "UPDATE_TASK_STATUS", reversible: true, prohibited: false, internallyExecutable: false },
  SEND_EXTERNAL_MESSAGE: { type: "SEND_EXTERNAL_MESSAGE", label: "Send an external message", defaultRisk: "high", requiredCapability: "EXTERNAL_COMMS", reversible: false, prohibited: false, internallyExecutable: false },
  MODIFY_STRATEGIC_GOAL: { type: "MODIFY_STRATEGIC_GOAL", label: "Modify a strategic goal", defaultRisk: "high", requiredCapability: "UPDATE_TASK_STATUS", reversible: true, prohibited: false, internallyExecutable: false },
  MOVE_MONEY: { type: "MOVE_MONEY", label: "Move money", defaultRisk: "critical", requiredCapability: "FINANCIAL", reversible: false, prohibited: true, internallyExecutable: false },
  DELETE_GOAL: { type: "DELETE_GOAL", label: "Permanently delete a goal", defaultRisk: "critical", requiredCapability: "DESTRUCTIVE", reversible: false, prohibited: true, internallyExecutable: false },
  DELETE_PROJECT: { type: "DELETE_PROJECT", label: "Permanently delete a project", defaultRisk: "critical", requiredCapability: "DESTRUCTIVE", reversible: false, prohibited: true, internallyExecutable: false },
  CHANGE_SECURITY_SETTINGS: { type: "CHANGE_SECURITY_SETTINGS", label: "Change security settings", defaultRisk: "critical", requiredCapability: "SECURITY", reversible: false, prohibited: true, internallyExecutable: false },
  CHANGE_AUTHENTICATION: { type: "CHANGE_AUTHENTICATION", label: "Change authentication", defaultRisk: "critical", requiredCapability: "SECURITY", reversible: false, prohibited: true, internallyExecutable: false },
  LEGAL_COMMITMENT: { type: "LEGAL_COMMITMENT", label: "Make a legal commitment", defaultRisk: "critical", requiredCapability: "EXTERNAL_COMMS", reversible: false, prohibited: true, internallyExecutable: false },
  MEDICAL_DECISION: { type: "MEDICAL_DECISION", label: "Make a medical decision", defaultRisk: "critical", requiredCapability: "EXTERNAL_COMMS", reversible: false, prohibited: true, internallyExecutable: false },
};

export const AUTOMATABLE_ACTION_TYPES: OpsActionType[] = Object.values(ACTION_CATALOG)
  .filter((entry) => entry.internallyExecutable)
  .map((entry) => entry.type);

export interface ExecutionLimits {
  maxActionsPerHour: number;
  maxChainDepth: number;
  actionTimeoutMs: number;
}

export interface AutonomyPolicy {
  autonomyLevel: AutonomyLevel;
  allowedActions: OpsActionType[];
  blockedActions: OpsActionType[];
  requireApprovalFor: OpsActionType[];
  executionLimits: ExecutionLimits;
  notifyOnExecute: boolean;
  updatedAt: string;
}

export const DEFAULT_AUTONOMY_POLICY: AutonomyPolicy = {
  autonomyLevel: 1,
  allowedActions: [],
  blockedActions: [],
  requireApprovalFor: [],
  executionLimits: { maxActionsPerHour: 12, maxChainDepth: 3, actionTimeoutMs: 15_000 },
  notifyOnExecute: true,
  updatedAt: "1970-01-01T00:00:00.000Z",
};

export interface ActionClassification {
  actionType: OpsActionType;
  riskLevel: OpsRiskLevel;
  requiredCapability: OpsCapability;
  reversible: boolean;
  prohibited: boolean;
  requiresApproval: boolean;
  affectedEntities: string[];
}

export function classifyAction(
  actionType: OpsActionType,
  affectedEntities: string[] = [],
): ActionClassification {
  const entry = ACTION_CATALOG[actionType];
  return {
    actionType,
    riskLevel: entry.defaultRisk,
    requiredCapability: entry.requiredCapability,
    reversible: entry.reversible,
    prohibited: entry.prohibited,
    requiresApproval: entry.prohibited || RISK_RANK[entry.defaultRisk] >= RISK_RANK.high,
    affectedEntities,
  };
}

export type PolicyDecisionKind = "ALLOW" | "DENY" | "REQUIRE_APPROVAL";

export interface PolicyDecision {
  decision: PolicyDecisionKind;
  reason: string;
}

/**
 * The policy engine. Deterministic; the AI can never bypass this. Order matters:
 * hard denials first, then approval requirements, then the narrow allow path.
 */
export function evaluatePolicy(
  policy: AutonomyPolicy,
  classification: ActionClassification,
  options: { agentCapabilities?: OpsCapability[]; paused?: boolean } = {},
): PolicyDecision {
  if (options.paused) {
    return { decision: "DENY", reason: "Automations are paused (emergency stop)." };
  }
  if (classification.prohibited) {
    return { decision: "DENY", reason: "This action type can never be executed autonomously." };
  }
  if (policy.autonomyLevel === 5 || policy.autonomyLevel === 0) {
    return {
      decision: "DENY",
      reason: `Autonomy level is ${AUTONOMY_LEVEL_META[policy.autonomyLevel].label}.`,
    };
  }
  if (policy.blockedActions.includes(classification.actionType)) {
    return { decision: "DENY", reason: "You have blocked this action type." };
  }
  if (
    options.agentCapabilities &&
    !options.agentCapabilities.includes(classification.requiredCapability)
  ) {
    return {
      decision: "DENY",
      reason: `Executor lacks the required capability (${classification.requiredCapability}).`,
    };
  }
  if (RISK_RANK[classification.riskLevel] >= RISK_RANK.high) {
    return { decision: "REQUIRE_APPROVAL", reason: "High-risk action — your approval is required." };
  }
  if (policy.autonomyLevel === 4) {
    return { decision: "REQUIRE_APPROVAL", reason: "Your policy asks for approval on every action." };
  }
  if (policy.requireApprovalFor.includes(classification.actionType)) {
    return { decision: "REQUIRE_APPROVAL", reason: "You require approval for this action type." };
  }
  if (
    classification.riskLevel === "low" &&
    policy.autonomyLevel >= 3 &&
    policy.allowedActions.includes(classification.actionType) &&
    ACTION_CATALOG[classification.actionType].internallyExecutable
  ) {
    return { decision: "ALLOW", reason: "Low-risk, explicitly permitted, internal action." };
  }
  if (policy.autonomyLevel <= 2) {
    return {
      decision: "REQUIRE_APPROVAL",
      reason: `Autonomy level ${AUTONOMY_LEVEL_META[policy.autonomyLevel].label} does not auto-execute.`,
    };
  }
  return { decision: "REQUIRE_APPROVAL", reason: "Not on your allow-list — approval required." };
}

// ── Lifecycle ───────────────────────────────────────────────────────────────

export type OpsActionStatus =
  | "PROPOSED"
  | "VALIDATED"
  | "AUTHORIZED"
  | "WAITING_APPROVAL"
  | "QUEUED"
  | "EXECUTING"
  | "VERIFIED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "FAILED"
  | "EXPIRED"
  | "ROLLED_BACK";

export const TERMINAL_OPS_STATUSES: OpsActionStatus[] = [
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
  "FAILED",
  "EXPIRED",
  "ROLLED_BACK",
];

export type LifecycleEvent =
  | "validate"
  | "authorize"
  | "need-approval"
  | "approve"
  | "reject"
  | "queue"
  | "start"
  | "verify"
  | "complete"
  | "fail"
  | "cancel"
  | "expire"
  | "rollback";

const TRANSITIONS: Record<OpsActionStatus, Partial<Record<LifecycleEvent, OpsActionStatus>>> = {
  PROPOSED: { validate: "VALIDATED", cancel: "CANCELLED", expire: "EXPIRED" },
  VALIDATED: { authorize: "AUTHORIZED", "need-approval": "WAITING_APPROVAL", reject: "REJECTED", cancel: "CANCELLED", expire: "EXPIRED" },
  WAITING_APPROVAL: { approve: "AUTHORIZED", reject: "REJECTED", cancel: "CANCELLED", expire: "EXPIRED" },
  AUTHORIZED: { queue: "QUEUED", cancel: "CANCELLED", expire: "EXPIRED" },
  QUEUED: { start: "EXECUTING", cancel: "CANCELLED", expire: "EXPIRED" },
  EXECUTING: { verify: "VERIFIED", fail: "FAILED", cancel: "CANCELLED" },
  VERIFIED: { complete: "COMPLETED", fail: "FAILED", rollback: "ROLLED_BACK" },
  COMPLETED: { rollback: "ROLLED_BACK" },
  REJECTED: {},
  CANCELLED: {},
  FAILED: { rollback: "ROLLED_BACK" },
  EXPIRED: {},
  ROLLED_BACK: {},
};

export function advance(status: OpsActionStatus, event: LifecycleEvent): OpsActionStatus | null {
  return TRANSITIONS[status][event] ?? null;
}

export interface OpsAction {
  id: string;
  correlationId: string;
  actionType: OpsActionType;
  source: ActionSource;
  title: string;
  reason: string;
  classification: ActionClassification;
  status: OpsActionStatus;
  policyDecision: PolicyDecision | null;
  dependsOn: string[];
  chainDepth: number;
  idempotencyKey: string;
  params: Record<string, string | number | boolean>;
  createdAt: string;
  decidedAt: string | null;
  executedAt: string | null;
  verifiedAt: string | null;
  result: OpsExecutionResult | null;
  failureReason: string | null;
  rollbackAvailable: boolean;
}

export interface OpsExecutionResult {
  ok: boolean;
  output: string;
  verifiedState: string;
  durationMs: number;
}

export interface AutomationSafetyViolation {
  code: "CIRCULAR_DEPENDENCY" | "DEPTH_LIMIT" | "DUPLICATE" | "RATE_LIMIT" | "TIMEOUT" | "PREREQUISITE_FAILED";
  message: string;
}

/** Loop / duplicate / rate-limit / dependency guards. Runs before an action is
 * queued; a violation stops it. */
export function checkAutomationSafety(
  action: Pick<OpsAction, "id" | "dependsOn" | "chainDepth" | "idempotencyKey">,
  existing: OpsAction[],
  policy: AutonomyPolicy,
  nowIso: string,
): { ok: true } | { ok: false; violation: AutomationSafetyViolation } {
  if (action.chainDepth > policy.executionLimits.maxChainDepth) {
    return { ok: false, violation: { code: "DEPTH_LIMIT", message: `Chain depth ${action.chainDepth} exceeds the limit of ${policy.executionLimits.maxChainDepth}.` } };
  }

  const byId = new Map(existing.map((item) => [item.id, item]));
  const seen = new Set<string>([action.id]);
  const stack = [...action.dependsOn];
  while (stack.length > 0) {
    const next = stack.pop()!;
    if (seen.has(next)) {
      return { ok: false, violation: { code: "CIRCULAR_DEPENDENCY", message: "This action depends on itself through a chain." } };
    }
    seen.add(next);
    const dep = byId.get(next);
    if (dep) stack.push(...dep.dependsOn);
  }

  for (const depId of action.dependsOn) {
    const dep = byId.get(depId);
    if (dep && (dep.status === "FAILED" || dep.status === "REJECTED" || dep.status === "CANCELLED")) {
      return { ok: false, violation: { code: "PREREQUISITE_FAILED", message: `Prerequisite "${dep.title}" did not succeed.` } };
    }
  }

  const duplicate = existing.find(
    (item) =>
      item.idempotencyKey === action.idempotencyKey &&
      (item.status === "COMPLETED" || item.status === "VERIFIED" || item.status === "EXECUTING"),
  );
  if (duplicate) {
    return { ok: false, violation: { code: "DUPLICATE", message: "An identical action has already run or is running." } };
  }

  const hourAgo = Date.parse(nowIso) - 3_600_000;
  const recent = existing.filter(
    (item) => item.executedAt != null && Date.parse(item.executedAt) >= hourAgo,
  ).length;
  if (recent >= policy.executionLimits.maxActionsPerHour) {
    return { ok: false, violation: { code: "RATE_LIMIT", message: `Rate limit reached (${policy.executionLimits.maxActionsPerHour}/hour).` } };
  }

  return { ok: true };
}

/** Deterministic execution of a safe, internal action. Produces a checkable
 * result; it never touches a domain repository. Non-internal action types return
 * an unverified prepared result the caller must route to a real service. */
export function runOpsAction(action: OpsAction): OpsExecutionResult {
  const entry = ACTION_CATALOG[action.actionType];
  if (!entry.internallyExecutable) {
    return {
      ok: false,
      output: "Prepared. This action type must be carried out by its own module or an external service.",
      verifiedState: "not-executed",
      durationMs: 0,
    };
  }
  switch (action.actionType) {
    case "SUMMARIZE_TODAY":
      return { ok: true, output: "Today's summary prepared from current plan and tasks.", verifiedState: "summary-ready", durationMs: 40 };
    case "PREPARE_BRIEFING":
      return { ok: true, output: "Morning briefing prepared (priorities, conflicts, deadlines).", verifiedState: "briefing-ready", durationMs: 55 };
    case "PREPARE_WEEKLY_REVIEW":
      return { ok: true, output: "Weekly review draft prepared from progress and risk signals.", verifiedState: "review-draft-ready", durationMs: 70 };
    case "PREPARE_PLAN_DRAFT":
      return { ok: true, output: "Plan draft prepared. Nothing saved — review and create it yourself.", verifiedState: "plan-draft-ready", durationMs: 60 };
    case "CREATE_INTERNAL_REMINDER":
      return { ok: true, output: "Internal reminder prepared for your review.", verifiedState: "reminder-ready", durationMs: 20 };
    case "RECALCULATE_ANALYTICS":
      return { ok: true, output: "Analytics recalculated from current records.", verifiedState: "analytics-current", durationMs: 90 };
    case "CLASSIFY_INBOX":
      return { ok: true, output: "Existing items classified by area and priority.", verifiedState: "classified", durationMs: 65 };
    default:
      return { ok: false, output: "Unknown internal action.", verifiedState: "unknown", durationMs: 0 };
  }
}

/** Never assume success. Confirm the execution produced the expected state. */
export function verifyOpsAction(
  action: OpsAction,
  result: OpsExecutionResult,
): { verified: boolean; note: string } {
  if (!result.ok) {
    return { verified: false, note: result.output };
  }
  const expected = ACTION_CATALOG[action.actionType].internallyExecutable;
  if (!expected) {
    return { verified: false, note: "Nothing to verify — the action was prepared, not executed." };
  }
  if (result.verifiedState && result.verifiedState !== "not-executed" && result.verifiedState !== "unknown") {
    return { verified: true, note: `Verified: ${result.verifiedState}.` };
  }
  return { verified: false, note: "Could not confirm the expected result state." };
}

export type RetryPolicy = "none" | "safe" | "approval";

export function retryPolicyFor(action: OpsAction): RetryPolicy {
  if (!ACTION_CATALOG[action.actionType].reversible) return "none";
  if (RISK_RANK[action.classification.riskLevel] >= RISK_RANK.medium) return "approval";
  return "safe";
}

// ── Automation rules & triggers ─────────────────────────────────────────────

export type TriggerType =
  | "TASK_COMPLETED"
  | "DEADLINE_NEAR"
  | "TIME_MORNING"
  | "WEEKLY_REVIEW"
  | "STATUS_CHANGE"
  | "THRESHOLD";

export interface AutomationRule {
  id: string;
  name: string;
  trigger: TriggerType;
  actionType: OpsActionType;
  enabled: boolean;
  createdAt: string;
}

export interface TriggerEvent {
  trigger: TriggerType;
  correlationId: string;
  at: string;
  chainDepth?: number;
}

/** Turn a fired trigger into an action proposal — or nothing. Rules can never
 * propose a strategic-goal or any prohibited change. */
export function evaluateAutomationRule(
  rule: AutomationRule,
  event: TriggerEvent,
  policy: AutonomyPolicy,
): { propose: OpsActionType; reason: string } | null {
  if (!rule.enabled) return null;
  if (rule.trigger !== event.trigger) return null;
  const entry = ACTION_CATALOG[rule.actionType];
  if (entry.prohibited || rule.actionType === "MODIFY_STRATEGIC_GOAL") return null;
  if (policy.blockedActions.includes(rule.actionType)) return null;
  return { propose: rule.actionType, reason: `Automation "${rule.name}" fired on ${event.trigger}.` };
}

// ── Data minimisation ──────────────────────────────────────────────────────

/** Give an executor only what its action needs — never the whole context. */
export function minimizeContextForExecutor(
  fullContext: Record<string, unknown>,
  action: OpsAction,
): Record<string, unknown> {
  const needed: Record<OpsActionType, string[]> = {
    SUMMARIZE_TODAY: ["todayPlan", "openTasks"],
    PREPARE_BRIEFING: ["todayPlan", "openTasks", "deadlines"],
    PREPARE_WEEKLY_REVIEW: ["progress", "risks"],
    PREPARE_PLAN_DRAFT: ["goalRef", "constraints"],
    CREATE_INTERNAL_REMINDER: ["reminderText", "dueDate"],
    RECALCULATE_ANALYTICS: ["metrics"],
    CLASSIFY_INBOX: ["items"],
    UPDATE_TASK_STATUS_VERIFIED: ["taskId", "verifiedStatus"],
    RESCHEDULE_FOCUS_BLOCK: ["blockId", "newTime"],
    SEND_EXTERNAL_MESSAGE: ["recipient", "body"],
    MODIFY_STRATEGIC_GOAL: ["goalId", "change"],
    MOVE_MONEY: [],
    DELETE_GOAL: [],
    DELETE_PROJECT: [],
    CHANGE_SECURITY_SETTINGS: [],
    CHANGE_AUTHENTICATION: [],
    LEGAL_COMMITMENT: [],
    MEDICAL_DECISION: [],
  };
  const keys = needed[action.actionType] ?? [];
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in fullContext) out[key] = fullContext[key];
  }
  return out;
}

// ── Telemetry ──────────────────────────────────────────────────────────────

export interface OpsHistoryEntry {
  id: string;
  correlationId: string;
  actionType: OpsActionType;
  source: ActionSource;
  status: OpsActionStatus;
  decision: PolicyDecisionKind | null;
  at: string;
  durationMs: number;
  verified: boolean;
  rolledBack: boolean;
  failureReason?: string;
}

export interface TelemetrySummary {
  executed: number;
  succeeded: number;
  failed: number;
  approvalRate: number;
  automationRate: number;
  avgDurationMs: number;
  retryRate: number;
  rollbackRate: number;
}

export function summarizeTelemetry(history: OpsHistoryEntry[]): TelemetrySummary {
  const executed = history.filter((entry) =>
    ["COMPLETED", "FAILED", "VERIFIED", "ROLLED_BACK"].includes(entry.status),
  );
  const succeeded = executed.filter((entry) => entry.status === "COMPLETED").length;
  const failed = executed.filter((entry) => entry.status === "FAILED").length;
  const needingApproval = history.filter((entry) => entry.decision === "REQUIRE_APPROVAL").length;
  const automated = history.filter((entry) => entry.source === "automation").length;
  const rolledBack = history.filter((entry) => entry.rolledBack).length;
  const totalDuration = executed.reduce((sum, entry) => sum + entry.durationMs, 0);
  return {
    executed: executed.length,
    succeeded,
    failed,
    approvalRate: history.length ? round2(needingApproval / history.length) : 0,
    automationRate: history.length ? round2(automated / history.length) : 0,
    avgDurationMs: executed.length ? Math.round(totalDuration / executed.length) : 0,
    retryRate: 0,
    rollbackRate: executed.length ? round2(rolledBack / executed.length) : 0,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export const OPS_STATUS_LABEL: Record<OpsActionStatus, string> = {
  PROPOSED: "Proposed",
  VALIDATED: "Validated",
  AUTHORIZED: "Authorized",
  WAITING_APPROVAL: "Waiting for approval",
  QUEUED: "Queued",
  EXECUTING: "Executing",
  VERIFIED: "Verified",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
  EXPIRED: "Expired",
  ROLLED_BACK: "Rolled back",
};

export const RISK_LABEL: Record<OpsRiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};
