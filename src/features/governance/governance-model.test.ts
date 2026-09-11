import { describe, expect, it } from "vitest";
import { DEFAULT_AUTONOMY_POLICY, classifyAction, type AutonomyPolicy, type OpsAction, type OpsActionType, type OpsHistoryEntry } from "@/features/autonomy";
import {
  appendAuditEvent,
  detectActionConflicts,
  dryRunAction,
  evaluateCircuitBreaker,
  evaluateConditionalAutonomy,
  evaluateGateway,
  verifyAuditIntegrity,
  type ConditionalAutonomyRule,
  type GatewayContext,
} from "./governance-model";

const NOW = "2026-09-11T09:00:00.000Z";

function policy(over: Partial<AutonomyPolicy> = {}): AutonomyPolicy {
  return { ...DEFAULT_AUTONOMY_POLICY, updatedAt: NOW, ...over };
}

function action(over: Partial<OpsAction> & { actionType: OpsActionType }): OpsAction {
  const classification = over.classification ?? classifyAction(over.actionType, []);
  return {
    id: "a1",
    correlationId: "c1",
    source: "automation",
    title: "Action",
    reason: "because",
    status: "QUEUED",
    policyDecision: null,
    dependsOn: [],
    chainDepth: 0,
    idempotencyKey: `${over.actionType}:k`,
    params: {},
    createdAt: NOW,
    decidedAt: null,
    executedAt: null,
    verifiedAt: null,
    result: null,
    failureReason: null,
    rollbackAvailable: true,
    ...over,
    classification,
  };
}

function rule(over: Partial<ConditionalAutonomyRule> & { actionType: OpsActionType }): ConditionalAutonomyRule {
  return {
    id: "rule1",
    actionType: over.actionType,
    condition: over.condition ?? {},
    enabled: over.enabled ?? true,
    createdAt: NOW,
  };
}

describe("evaluateConditionalAutonomy (Level 4)", () => {
  it("allows only when the matching, enabled rule's conditions hold", () => {
    const classification = classifyAction("SUMMARIZE_TODAY");
    const r = rule({ actionType: "SUMMARIZE_TODAY", condition: { minConfidence: "medium" } });
    expect(evaluateConditionalAutonomy(r, classification, { confidence: "high", hasConflict: false })).toBe(true);
    expect(evaluateConditionalAutonomy(r, classification, { confidence: "low", hasConflict: false })).toBe(false);
  });

  it("never applies to a prohibited action type, regardless of condition", () => {
    const r = rule({ actionType: "MOVE_MONEY", condition: {} });
    expect(evaluateConditionalAutonomy(r, classifyAction("MOVE_MONEY"), { hasConflict: false })).toBe(false);
  });

  it("never applies to a high/critical-risk action type", () => {
    const r = rule({ actionType: "SEND_EXTERNAL_MESSAGE", condition: {} });
    expect(evaluateConditionalAutonomy(r, classifyAction("SEND_EXTERNAL_MESSAGE"), { hasConflict: false })).toBe(false);
  });

  it("respects requireNoConflicts", () => {
    const r = rule({ actionType: "SUMMARIZE_TODAY", condition: { requireNoConflicts: true } });
    expect(evaluateConditionalAutonomy(r, classifyAction("SUMMARIZE_TODAY"), { hasConflict: true })).toBe(false);
  });

  it("does nothing for a disabled rule or mismatched action type", () => {
    expect(evaluateConditionalAutonomy(rule({ actionType: "SUMMARIZE_TODAY", enabled: false }), classifyAction("SUMMARIZE_TODAY"), { hasConflict: false })).toBe(false);
    expect(evaluateConditionalAutonomy(rule({ actionType: "SUMMARIZE_TODAY" }), classifyAction("PREPARE_BRIEFING"), { hasConflict: false })).toBe(false);
  });
});

describe("detectActionConflicts", () => {
  it("flags two active actions of the same type sharing an entity", () => {
    const a = action({ id: "a", actionType: "SUMMARIZE_TODAY", classification: { affectedEntities: ["goal:1"] } as never });
    const b = action({ id: "b", actionType: "SUMMARIZE_TODAY", classification: { affectedEntities: ["goal:1"] } as never });
    const conflicts = detectActionConflicts([
      { ...a, classification: classifyAction("SUMMARIZE_TODAY", ["goal:1"]) },
      { ...b, classification: classifyAction("SUMMARIZE_TODAY", ["goal:1"]) },
    ]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.entity).toBe("goal:1");
  });

  it("flags opposing action types on the same entity", () => {
    const a = action({ id: "a", actionType: "UPDATE_TASK_STATUS_VERIFIED", classification: classifyAction("UPDATE_TASK_STATUS_VERIFIED", ["task:1"]) });
    const b = action({ id: "b", actionType: "RESCHEDULE_FOCUS_BLOCK", classification: classifyAction("RESCHEDULE_FOCUS_BLOCK", ["task:1"]) });
    expect(detectActionConflicts([a, b])).toHaveLength(1);
  });

  it("ignores actions on different entities or already terminal", () => {
    const a = action({ id: "a", actionType: "SUMMARIZE_TODAY", classification: classifyAction("SUMMARIZE_TODAY", ["goal:1"]) });
    const b = action({ id: "b", actionType: "SUMMARIZE_TODAY", classification: classifyAction("SUMMARIZE_TODAY", ["goal:2"]) });
    const c = action({ id: "c", actionType: "SUMMARIZE_TODAY", classification: classifyAction("SUMMARIZE_TODAY", ["goal:1"]), status: "COMPLETED" });
    expect(detectActionConflicts([a, b])).toHaveLength(0);
    expect(detectActionConflicts([a, c])).toHaveLength(0);
  });
});

describe("evaluateCircuitBreaker", () => {
  function entry(over: Partial<OpsHistoryEntry> & { status: OpsHistoryEntry["status"] }): OpsHistoryEntry {
    return {
      id: "e",
      correlationId: "c",
      actionType: "SUMMARIZE_TODAY",
      source: "automation",
      status: over.status,
      decision: "ALLOW",
      at: NOW,
      durationMs: 10,
      verified: over.status === "COMPLETED",
      rolledBack: false,
    };
  }

  it("trips after 3 consecutive failures of the same action type", () => {
    const history = [entry({ status: "FAILED" }), entry({ status: "FAILED" }), entry({ status: "FAILED" })];
    const result = evaluateCircuitBreaker(history, "SUMMARIZE_TODAY");
    expect(result.tripped).toBe(true);
    expect(result.consecutiveFailures).toBe(3);
  });

  it("does not trip when a success breaks the streak", () => {
    const history = [entry({ status: "FAILED" }), entry({ status: "FAILED" }), entry({ status: "COMPLETED" }), entry({ status: "FAILED" })];
    expect(evaluateCircuitBreaker(history, "SUMMARIZE_TODAY").tripped).toBe(false);
  });

  it("only counts the given action type", () => {
    const history = [
      { ...entry({ status: "FAILED" }), actionType: "PREPARE_BRIEFING" as OpsActionType },
      entry({ status: "FAILED" }),
      entry({ status: "FAILED" }),
    ];
    expect(evaluateCircuitBreaker(history, "SUMMARIZE_TODAY").tripped).toBe(false);
  });
});

describe("dryRunAction", () => {
  it("never mutates anything and honestly reports what it would do", () => {
    const internal = dryRunAction(action({ actionType: "SUMMARIZE_TODAY" }));
    expect(internal.wouldExecute).toBe(true);
    const external = dryRunAction(action({ actionType: "SEND_EXTERNAL_MESSAGE" }));
    expect(external.wouldExecute).toBe(false);
    expect(external.preview).toMatch(/not executed by mastery/i);
  });
});

describe("evaluateGateway", () => {
  function ctx(over: Partial<GatewayContext> = {}): GatewayContext {
    return {
      policy: policy(),
      paused: false,
      existingActions: [],
      history: [],
      conditionalRules: [],
      ...over,
    };
  }

  it("denies a prohibited action unconditionally", () => {
    expect(evaluateGateway("MOVE_MONEY", [], ctx()).decision).toBe("DENY");
  });

  it("pauses for the global kill switch before anything else", () => {
    expect(evaluateGateway("SUMMARIZE_TODAY", [], ctx({ paused: true })).decision).toBe("PAUSED_KILL_SWITCH");
  });

  it("pauses when the circuit breaker has tripped for this action type", () => {
    const history: OpsHistoryEntry[] = Array.from({ length: 3 }, () => ({
      id: "e",
      correlationId: "c",
      actionType: "SUMMARIZE_TODAY",
      source: "automation",
      status: "FAILED",
      decision: "ALLOW",
      at: NOW,
      durationMs: 10,
      verified: false,
      rolledBack: false,
    }));
    expect(evaluateGateway("SUMMARIZE_TODAY", [], ctx({ history })).decision).toBe("PAUSED_CIRCUIT_BREAKER");
  });

  it("pauses on a live entity conflict rather than allowing both", () => {
    const existing = action({ actionType: "SUMMARIZE_TODAY", classification: classifyAction("SUMMARIZE_TODAY", ["goal:1"]) });
    expect(
      evaluateGateway("SUMMARIZE_TODAY", ["goal:1"], ctx({ existingActions: [existing] })).decision,
    ).toBe("PAUSED_CONFLICT");
  });

  it("allows a low-risk, permitted action at a sufficient autonomy level", () => {
    const p = policy({ autonomyLevel: 3, allowedActions: ["SUMMARIZE_TODAY"] });
    expect(evaluateGateway("SUMMARIZE_TODAY", [], ctx({ policy: p })).decision).toBe("ALLOW");
  });

  it("upgrades REQUIRE_APPROVAL to ALLOW_CONDITIONAL only when a Level 4 rule's condition holds", () => {
    const p = policy({ autonomyLevel: 2 }); // R would REQUIRE_APPROVAL here
    const conditionalRules = [rule({ actionType: "SUMMARIZE_TODAY", condition: { minConfidence: "medium" } })];
    const allowed = evaluateGateway("SUMMARIZE_TODAY", [], ctx({ policy: p, conditionalRules, confidence: "high" }));
    expect(allowed.decision).toBe("ALLOW_CONDITIONAL");

    const stillNeedsApproval = evaluateGateway("SUMMARIZE_TODAY", [], ctx({ policy: p, conditionalRules, confidence: "low" }));
    expect(stillNeedsApproval.decision).toBe("REQUIRE_APPROVAL");
  });
});

describe("audit log (append-only, tamper-evident)", () => {
  it("chains each event to the previous one's hash", () => {
    let chain = appendAuditEvent([], "ACTION_PROPOSED", "Proposed X", NOW);
    chain = appendAuditEvent(chain, "ACTION_APPROVED", "Approved X", NOW);
    expect(chain[1]?.prevHash).toBe(chain[0]?.hash);
    expect(verifyAuditIntegrity(chain).intact).toBe(true);
  });

  it("detects tampering when an entry is altered out of band", () => {
    const chain = appendAuditEvent(appendAuditEvent([], "ACTION_PROPOSED", "Proposed X", NOW), "ACTION_APPROVED", "Approved X", NOW);
    const tampered = [{ ...chain[0]!, summary: "Proposed something else" }, chain[1]!];
    const result = verifyAuditIntegrity(tampered);
    expect(result.intact).toBe(false);
    expect(result.brokenAtIndex).toBe(0);
  });
});
