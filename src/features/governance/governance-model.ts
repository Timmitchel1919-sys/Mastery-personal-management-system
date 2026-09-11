import {
  ACTION_CATALOG,
  RISK_RANK,
  classifyAction,
  evaluatePolicy,
  type ActionClassification,
  type AutonomyPolicy,
  type OpsAction,
  type OpsActionStatus,
  type OpsActionType,
  type OpsHistoryEntry,
  type PolicyDecision,
} from "@/features/autonomy";

/**
 * Layer V — Controlled Autonomous Personal Operating Loop (pure core).
 *
 * This is a *governance extension* over Layer R, not a second execution engine.
 * It reuses Layer R's action catalog, classification, and policy engine
 * unchanged, and adds exactly the pieces R does not have: conditional
 * autonomy (Level 4), a conflict engine over concurrent actions, a
 * consecutive-failure circuit breaker, a dry-run preview, and the single
 * `evaluateGateway` entry point every proposal — human or AI-Workforce — must
 * pass through. Level 5 (full autonomy) is deliberately not implemented
 * anywhere in this module.
 */

// ── Conditional autonomy (Level 4) ──────────────────────────────────────────

export interface AutonomyCondition {
  /** Only auto-execute when the proposal's own confidence is at least this. */
  minConfidence?: "high" | "medium";
  /** Only auto-execute when the action's risk is at or below this rank (low=0..critical=3). */
  maxRiskRank?: number;
  /** Only auto-execute when no unresolved conflict touches the same entities. */
  requireNoConflicts?: boolean;
}

export interface ConditionalAutonomyRule {
  id: string;
  actionType: OpsActionType;
  condition: AutonomyCondition;
  enabled: boolean;
  createdAt: string;
}

export interface ConditionalEvaluationContext {
  confidence?: "high" | "medium" | "low";
  hasConflict: boolean;
}

/** LEVEL 4 — execute a predefined action only when its user-defined conditions
 * hold. Never applies to a prohibited action type, and never lowers the floor
 * Layer R's policy engine already set — it can only apply when R itself would
 * otherwise require approval for an explicitly non-prohibited, non-critical
 * action. */
export function evaluateConditionalAutonomy(
  rule: ConditionalAutonomyRule,
  classification: ActionClassification,
  context: ConditionalEvaluationContext,
): boolean {
  if (!rule.enabled) return false;
  if (rule.actionType !== classification.actionType) return false;
  if (classification.prohibited) return false;
  if (RISK_RANK[classification.riskLevel] >= RISK_RANK.high) return false;
  const condition = rule.condition;
  if (condition.maxRiskRank != null && RISK_RANK[classification.riskLevel] > condition.maxRiskRank) return false;
  if (condition.minConfidence) {
    const rank = { high: 0, medium: 1, low: 2 } as const;
    if (!context.confidence || rank[context.confidence] > rank[condition.minConfidence]) return false;
  }
  if (condition.requireNoConflicts && context.hasConflict) return false;
  return true;
}

export type GatewayDecision =
  | "ALLOW"
  | "ALLOW_CONDITIONAL"
  | "REQUIRE_APPROVAL"
  | "DENY"
  | "PAUSED_CONFLICT"
  | "PAUSED_CIRCUIT_BREAKER"
  | "PAUSED_KILL_SWITCH";

export interface GatewayResult {
  decision: GatewayDecision;
  reason: string;
  classification: ActionClassification;
  policyDecision: PolicyDecision;
}

// ── Conflict engine ──────────────────────────────────────────────────────────

/** Action-type pairs that must never both be active against the same
 * entity — mirrors the reasoning in Layer S's opposing-proposal check, applied
 * here to live queued/executing actions rather than adaptation proposals. */
const OPPOSING_ACTION_TYPES: ReadonlyArray<readonly [OpsActionType, OpsActionType]> = [
  ["UPDATE_TASK_STATUS_VERIFIED", "RESCHEDULE_FOCUS_BLOCK"],
];

export interface ActionConflict {
  a: string;
  b: string;
  entity: string;
  reason: string;
}

const NON_TERMINAL: OpsActionStatus[] = [
  "PROPOSED",
  "VALIDATED",
  "AUTHORIZED",
  "WAITING_APPROVAL",
  "QUEUED",
  "EXECUTING",
];

/** Two active actions that target the same entity and are the same type are
 * a duplicate-in-flight conflict; two active actions on the same entity with
 * opposing types are a state conflict. Either PAUSEs rather than lets both run. */
export function detectActionConflicts(actions: OpsAction[]): ActionConflict[] {
  const active = actions.filter((action) => NON_TERMINAL.includes(action.status));
  const conflicts: ActionConflict[] = [];

  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const a = active[i]!;
      const b = active[j]!;
      const sharedEntities = a.classification.affectedEntities.filter((entity) =>
        b.classification.affectedEntities.includes(entity),
      );
      if (sharedEntities.length === 0) continue;

      const sameType = a.actionType === b.actionType;
      const opposing = OPPOSING_ACTION_TYPES.some(
        ([x, y]) => (a.actionType === x && b.actionType === y) || (a.actionType === y && b.actionType === x),
      );
      if (!sameType && !opposing) continue;

      for (const entity of sharedEntities) {
        conflicts.push({
          a: a.id,
          b: b.id,
          entity,
          reason: sameType
            ? `Both "${a.title}" and "${b.title}" target ${entity} with the same action.`
            : `"${a.title}" and "${b.title}" target ${entity} with incompatible actions.`,
        });
      }
    }
  }
  return conflicts;
}

// ── Circuit breaker ──────────────────────────────────────────────────────────

const CIRCUIT_BREAKER_THRESHOLD = 3;

export interface CircuitBreakerResult {
  tripped: boolean;
  consecutiveFailures: number;
  reason: string | null;
}

/** After N consecutive failures of the same action type, stop offering it for
 * auto-execution and ask the user to review — never retry indefinitely. */
export function evaluateCircuitBreaker(
  history: OpsHistoryEntry[],
  actionType: OpsActionType,
  threshold: number = CIRCUIT_BREAKER_THRESHOLD,
): CircuitBreakerResult {
  const relevant = history.filter((entry) => entry.actionType === actionType && ["COMPLETED", "FAILED"].includes(entry.status));
  let consecutiveFailures = 0;
  for (const entry of relevant) {
    if (entry.status === "FAILED") consecutiveFailures += 1;
    else break;
  }
  const tripped = consecutiveFailures >= threshold;
  return {
    tripped,
    consecutiveFailures,
    reason: tripped
      ? `${consecutiveFailures} consecutive failures for ${ACTION_CATALOG[actionType].label} — paused for review.`
      : null,
  };
}

// ── Dry run ──────────────────────────────────────────────────────────────────

export interface DryRunResult {
  actionType: OpsActionType;
  wouldExecute: boolean;
  preview: string;
  affectedEntities: string[];
}

/** "Here is what MASTERY would change." Never mutates anything — it only
 * describes the internally-executable action types Layer R can actually run;
 * everything else is honestly reported as not executable by MASTERY itself. */
export function dryRunAction(action: OpsAction): DryRunResult {
  const entry = ACTION_CATALOG[action.actionType];
  return {
    actionType: action.actionType,
    wouldExecute: entry.internallyExecutable,
    preview: entry.internallyExecutable
      ? `Would run "${entry.label}" and verify the result. Nothing changes until this step actually executes.`
      : `"${entry.label}" is prepared for review — it is not executed by MASTERY itself.`,
    affectedEntities: action.classification.affectedEntities,
  };
}

// ── Action Gateway ───────────────────────────────────────────────────────────

export interface GatewayContext {
  policy: AutonomyPolicy;
  paused: boolean;
  existingActions: OpsAction[];
  history: OpsHistoryEntry[];
  conditionalRules: ConditionalAutonomyRule[];
  confidence?: "high" | "medium" | "low";
}

/**
 * The single controlled entry point every proposal — from the UI, an
 * automation rule, or a future AI Workforce agent — must pass through. It
 * never bypasses Layer R's policy engine; it can only ever narrow what R
 * would allow (conflict/circuit-breaker pauses) or, for LEVEL 4, upgrade an
 * R "REQUIRE_APPROVAL" to auto-execute when the user's own condition holds.
 */
export function evaluateGateway(
  actionType: OpsActionType,
  affectedEntities: string[],
  ctx: GatewayContext,
): GatewayResult {
  const classification = classifyAction(actionType, affectedEntities);
  const policyDecision = evaluatePolicy(ctx.policy, classification, { paused: ctx.paused });

  if (ctx.paused) {
    return { decision: "PAUSED_KILL_SWITCH", reason: policyDecision.reason, classification, policyDecision };
  }

  const breaker = evaluateCircuitBreaker(ctx.history, actionType);
  if (breaker.tripped) {
    return { decision: "PAUSED_CIRCUIT_BREAKER", reason: breaker.reason!, classification, policyDecision };
  }

  const hasConflict = ctx.existingActions.some((existing) =>
    existing.classification.affectedEntities.some((entity) => affectedEntities.includes(entity)) &&
    NON_TERMINAL.includes(existing.status),
  );
  if (hasConflict && policyDecision.decision !== "DENY") {
    return {
      decision: "PAUSED_CONFLICT",
      reason: "Another in-flight action already targets the same entity.",
      classification,
      policyDecision,
    };
  }

  if (policyDecision.decision === "DENY") {
    return { decision: "DENY", reason: policyDecision.reason, classification, policyDecision };
  }
  if (policyDecision.decision === "ALLOW") {
    return { decision: "ALLOW", reason: policyDecision.reason, classification, policyDecision };
  }

  // policyDecision.decision === "REQUIRE_APPROVAL" — check for a Level 4 upgrade.
  const matchingRule = ctx.conditionalRules.find((rule) => rule.actionType === actionType && rule.enabled);
  if (
    matchingRule &&
    evaluateConditionalAutonomy(matchingRule, classification, { confidence: ctx.confidence, hasConflict })
  ) {
    return {
      decision: "ALLOW_CONDITIONAL",
      reason: "Your predefined condition for this action type is satisfied.",
      classification,
      policyDecision,
    };
  }

  return { decision: "REQUIRE_APPROVAL", reason: policyDecision.reason, classification, policyDecision };
}

export const GATEWAY_DECISION_LABEL: Record<GatewayDecision, string> = {
  ALLOW: "Allowed",
  ALLOW_CONDITIONAL: "Allowed — condition met",
  REQUIRE_APPROVAL: "Needs your approval",
  DENY: "Denied",
  PAUSED_CONFLICT: "Paused — conflict",
  PAUSED_CIRCUIT_BREAKER: "Paused — repeated failures",
  PAUSED_KILL_SWITCH: "Paused — automation stopped",
};

// ── Audit log (tamper-evident, append-only) ─────────────────────────────────

export type AuditEventType =
  | "ACTION_PROPOSED"
  | "ACTION_APPROVED"
  | "ACTION_REJECTED"
  | "ACTION_STARTED"
  | "ACTION_COMPLETED"
  | "ACTION_FAILED"
  | "ACTION_CANCELLED"
  | "POLICY_CHANGED"
  | "AUTONOMY_PAUSED";

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  summary: string;
  at: string;
  /** Deterministic, non-cryptographic hash of this event's own content. */
  hash: string;
  /** Hash of the previous event in the chain — "genesis" for the first entry. */
  prevHash: string;
}

/** A small deterministic, dependency-free string hash (FNV-1a). This provides
 * tamper *evidence* for a client-side log, not cryptographic security — a
 * server-authoritative audit trail is still the system of record for anything
 * consequential; this makes local tampering detectable, not impossible. */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function appendAuditEvent(
  chain: AuditEvent[],
  type: AuditEventType,
  summary: string,
  atIso: string,
): AuditEvent[] {
  const prevHash = chain.length > 0 ? chain[chain.length - 1]!.hash : "genesis";
  const id = `audit-${atIso}-${chain.length}`;
  const hash = fnv1a(`${id}|${type}|${summary}|${atIso}|${prevHash}`);
  return [...chain, { id, type, summary, at: atIso, hash, prevHash }];
}

export interface AuditIntegrityResult {
  intact: boolean;
  brokenAtIndex: number | null;
}

/** Recompute the chain and confirm nothing was altered out of band — e.g. by
 * editing localStorage directly. */
export function verifyAuditIntegrity(chain: AuditEvent[]): AuditIntegrityResult {
  let prevHash = "genesis";
  for (let index = 0; index < chain.length; index += 1) {
    const event = chain[index]!;
    if (event.prevHash !== prevHash) return { intact: false, brokenAtIndex: index };
    const expected = fnv1a(`${event.id}|${event.type}|${event.summary}|${event.at}|${event.prevHash}`);
    if (expected !== event.hash) return { intact: false, brokenAtIndex: index };
    prevHash = event.hash;
  }
  return { intact: true, brokenAtIndex: null };
}
