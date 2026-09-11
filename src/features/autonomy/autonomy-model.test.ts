import { describe, expect, it } from "vitest";
import {
  ACTION_CATALOG,
  AUTOMATABLE_ACTION_TYPES,
  DEFAULT_AUTONOMY_POLICY,
  advance,
  checkAutomationSafety,
  classifyAction,
  evaluateAutomationRule,
  evaluatePolicy,
  minimizeContextForExecutor,
  retryPolicyFor,
  runOpsAction,
  summarizeTelemetry,
  verifyOpsAction,
  type AutomationRule,
  type AutonomyPolicy,
  type OpsAction,
  type OpsActionType,
  type OpsHistoryEntry,
  type TriggerEvent,
} from "./autonomy-model";

const NOW = "2026-09-10T09:00:00.000Z";

function policy(over: Partial<AutonomyPolicy> = {}): AutonomyPolicy {
  return { ...DEFAULT_AUTONOMY_POLICY, updatedAt: NOW, ...over };
}

function action(over: Partial<OpsAction> & { actionType: OpsActionType }): OpsAction {
  const classification = classifyAction(over.actionType, over.classification?.affectedEntities ?? []);
  return {
    id: over.id ?? "a1",
    correlationId: over.correlationId ?? "corr-1",
    actionType: over.actionType,
    source: over.source ?? "automation",
    title: over.title ?? ACTION_CATALOG[over.actionType].label,
    reason: over.reason ?? "because",
    classification,
    status: over.status ?? "PROPOSED",
    policyDecision: over.policyDecision ?? null,
    dependsOn: over.dependsOn ?? [],
    chainDepth: over.chainDepth ?? 0,
    idempotencyKey: over.idempotencyKey ?? `${over.actionType}:default`,
    params: over.params ?? {},
    createdAt: over.createdAt ?? NOW,
    decidedAt: over.decidedAt ?? null,
    executedAt: over.executedAt ?? null,
    verifiedAt: over.verifiedAt ?? null,
    result: over.result ?? null,
    failureReason: over.failureReason ?? null,
    rollbackAvailable: over.rollbackAvailable ?? true,
  };
}

describe("classifyAction", () => {
  it("classifies a low-risk internal action as reversible, no approval", () => {
    const c = classifyAction("SUMMARIZE_TODAY");
    expect(c.riskLevel).toBe("low");
    expect(c.prohibited).toBe(false);
    expect(c.requiresApproval).toBe(false);
  });

  it("marks money / delete / security actions prohibited and approval-requiring", () => {
    for (const type of ["MOVE_MONEY", "DELETE_GOAL", "CHANGE_SECURITY_SETTINGS"] as OpsActionType[]) {
      const c = classifyAction(type);
      expect(c.prohibited).toBe(true);
      expect(c.riskLevel).toBe("critical");
      expect(c.requiresApproval).toBe(true);
    }
  });
});

describe("evaluatePolicy", () => {
  it("DENIES every prohibited action regardless of level", () => {
    const p = policy({ autonomyLevel: 3, allowedActions: ["MOVE_MONEY"] });
    expect(evaluatePolicy(p, classifyAction("MOVE_MONEY")).decision).toBe("DENY");
  });

  it("DENIES when automations are paused (emergency stop)", () => {
    const p = policy({ autonomyLevel: 3, allowedActions: ["SUMMARIZE_TODAY"] });
    expect(evaluatePolicy(p, classifyAction("SUMMARIZE_TODAY"), { paused: true }).decision).toBe("DENY");
  });

  it("DENIES at level 0 (observe) and level 5 (prohibited)", () => {
    expect(evaluatePolicy(policy({ autonomyLevel: 0 }), classifyAction("SUMMARIZE_TODAY")).decision).toBe("DENY");
    expect(evaluatePolicy(policy({ autonomyLevel: 5 }), classifyAction("SUMMARIZE_TODAY")).decision).toBe("DENY");
  });

  it("DENIES a blocked action type", () => {
    const p = policy({ autonomyLevel: 3, allowedActions: ["SUMMARIZE_TODAY"], blockedActions: ["SUMMARIZE_TODAY"] });
    expect(evaluatePolicy(p, classifyAction("SUMMARIZE_TODAY")).decision).toBe("DENY");
  });

  it("DENIES when the executor lacks the required capability (least privilege)", () => {
    const p = policy({ autonomyLevel: 3, allowedActions: ["SUMMARIZE_TODAY"] });
    const decision = evaluatePolicy(p, classifyAction("SUMMARIZE_TODAY"), { agentCapabilities: ["READ"] });
    expect(decision.decision).toBe("DENY");
    expect(decision.reason).toMatch(/capability/i);
  });

  it("REQUIRES approval for high-risk actions even if allow-listed", () => {
    const p = policy({ autonomyLevel: 4, allowedActions: ["SEND_EXTERNAL_MESSAGE"] });
    expect(evaluatePolicy(p, classifyAction("SEND_EXTERNAL_MESSAGE")).decision).toBe("REQUIRE_APPROVAL");
  });

  it("REQUIRES approval at level 4 for everything", () => {
    const p = policy({ autonomyLevel: 4, allowedActions: ["SUMMARIZE_TODAY"] });
    expect(evaluatePolicy(p, classifyAction("SUMMARIZE_TODAY")).decision).toBe("REQUIRE_APPROVAL");
  });

  it("REQUIRES approval for types on the requireApprovalFor list", () => {
    const p = policy({ autonomyLevel: 3, allowedActions: ["SUMMARIZE_TODAY"], requireApprovalFor: ["SUMMARIZE_TODAY"] });
    expect(evaluatePolicy(p, classifyAction("SUMMARIZE_TODAY")).decision).toBe("REQUIRE_APPROVAL");
  });

  it("ALLOWS only a low-risk, explicitly permitted, internal action at level >= 3", () => {
    const p = policy({ autonomyLevel: 3, allowedActions: ["SUMMARIZE_TODAY"] });
    expect(evaluatePolicy(p, classifyAction("SUMMARIZE_TODAY")).decision).toBe("ALLOW");
  });

  it("REQUIRES approval for a permitted action when the level is only 1-2", () => {
    const p = policy({ autonomyLevel: 2, allowedActions: ["SUMMARIZE_TODAY"] });
    expect(evaluatePolicy(p, classifyAction("SUMMARIZE_TODAY")).decision).toBe("REQUIRE_APPROVAL");
  });

  it("REQUIRES approval for a non-allow-listed low-risk action at level 3", () => {
    const p = policy({ autonomyLevel: 3, allowedActions: [] });
    expect(evaluatePolicy(p, classifyAction("SUMMARIZE_TODAY")).decision).toBe("REQUIRE_APPROVAL");
  });
});

describe("lifecycle state machine", () => {
  it("advances the happy path PROPOSED → COMPLETED", () => {
    const events = ["validate", "authorize", "queue", "start", "verify", "complete"] as const;
    let status: ReturnType<typeof advance> = "PROPOSED";
    for (const event of events) {
      status = advance(status as never, event);
      expect(status).not.toBeNull();
    }
    expect(status).toBe("COMPLETED");
  });

  it("routes VALIDATED → WAITING_APPROVAL → AUTHORIZED on approval", () => {
    expect(advance("VALIDATED", "need-approval")).toBe("WAITING_APPROVAL");
    expect(advance("WAITING_APPROVAL", "approve")).toBe("AUTHORIZED");
    expect(advance("WAITING_APPROVAL", "reject")).toBe("REJECTED");
  });

  it("rejects impossible transitions", () => {
    expect(advance("COMPLETED", "start")).toBeNull();
    expect(advance("PROPOSED", "complete")).toBeNull();
  });

  it("allows rollback from COMPLETED / FAILED / VERIFIED", () => {
    expect(advance("COMPLETED", "rollback")).toBe("ROLLED_BACK");
    expect(advance("FAILED", "rollback")).toBe("ROLLED_BACK");
  });
});

describe("checkAutomationSafety", () => {
  const p = policy({ executionLimits: { maxActionsPerHour: 2, maxChainDepth: 2, actionTimeoutMs: 1000 } });

  it("stops a chain deeper than the limit", () => {
    const result = checkAutomationSafety(action({ actionType: "SUMMARIZE_TODAY", chainDepth: 3 }), [], p, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violation.code).toBe("DEPTH_LIMIT");
  });

  it("detects a circular dependency", () => {
    const a = action({ id: "a", actionType: "SUMMARIZE_TODAY", dependsOn: ["b"] });
    const b = action({ id: "b", actionType: "PREPARE_BRIEFING", dependsOn: ["a"] });
    const result = checkAutomationSafety(a, [a, b], p, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violation.code).toBe("CIRCULAR_DEPENDENCY");
  });

  it("blocks a dependent action when the prerequisite failed", () => {
    const dep = action({ id: "dep", actionType: "PREPARE_BRIEFING", status: "FAILED" });
    const a = action({ id: "a", actionType: "SUMMARIZE_TODAY", dependsOn: ["dep"] });
    const result = checkAutomationSafety(a, [dep], p, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violation.code).toBe("PREREQUISITE_FAILED");
  });

  it("rejects a duplicate idempotency key that already ran", () => {
    const done = action({ id: "done", actionType: "SUMMARIZE_TODAY", idempotencyKey: "k1", status: "COMPLETED" });
    const a = action({ id: "a", actionType: "SUMMARIZE_TODAY", idempotencyKey: "k1" });
    const result = checkAutomationSafety(a, [done], p, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violation.code).toBe("DUPLICATE");
  });

  it("enforces the per-hour rate limit", () => {
    const recent = [
      action({ id: "r1", actionType: "SUMMARIZE_TODAY", idempotencyKey: "r1", executedAt: NOW }),
      action({ id: "r2", actionType: "PREPARE_BRIEFING", idempotencyKey: "r2", executedAt: NOW }),
    ];
    const a = action({ id: "a", actionType: "PREPARE_WEEKLY_REVIEW", idempotencyKey: "a" });
    const result = checkAutomationSafety(a, recent, p, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violation.code).toBe("RATE_LIMIT");
  });

  it("passes a clean action", () => {
    expect(checkAutomationSafety(action({ actionType: "SUMMARIZE_TODAY" }), [], p, NOW).ok).toBe(true);
  });
});

describe("runOpsAction + verifyOpsAction", () => {
  it("executes an internal action and verifies the expected state", () => {
    const a = action({ actionType: "SUMMARIZE_TODAY" });
    const result = runOpsAction(a);
    expect(result.ok).toBe(true);
    expect(verifyOpsAction(a, result)).toEqual({ verified: true, note: "Verified: summary-ready." });
  });

  it("does not execute a non-internal action — it only prepares it", () => {
    const a = action({ actionType: "SEND_EXTERNAL_MESSAGE" });
    const result = runOpsAction(a);
    expect(result.ok).toBe(false);
    expect(verifyOpsAction(a, result).verified).toBe(false);
  });

  it("every AUTOMATABLE_ACTION_TYPES entry runs and verifies", () => {
    for (const type of AUTOMATABLE_ACTION_TYPES) {
      const a = action({ actionType: type });
      expect(verifyOpsAction(a, runOpsAction(a)).verified).toBe(true);
    }
  });
});

describe("retryPolicyFor", () => {
  it("is 'none' for irreversible, 'approval' for medium+, 'safe' for low reversible", () => {
    expect(retryPolicyFor(action({ actionType: "SEND_EXTERNAL_MESSAGE" }))).toBe("none");
    expect(retryPolicyFor(action({ actionType: "UPDATE_TASK_STATUS_VERIFIED" }))).toBe("approval");
    expect(retryPolicyFor(action({ actionType: "SUMMARIZE_TODAY" }))).toBe("safe");
  });
});

describe("evaluateAutomationRule", () => {
  const p = policy();
  const event: TriggerEvent = { trigger: "TASK_COMPLETED", correlationId: "c", at: NOW };

  function rule(over: Partial<AutomationRule> & { actionType: OpsActionType }): AutomationRule {
    return {
      id: "r",
      name: over.name ?? "Rule",
      trigger: over.trigger ?? "TASK_COMPLETED",
      actionType: over.actionType,
      enabled: over.enabled ?? true,
      createdAt: NOW,
    };
  }

  it("proposes a safe action when its trigger fires", () => {
    expect(evaluateAutomationRule(rule({ actionType: "RECALCULATE_ANALYTICS" }), event, p)?.propose).toBe(
      "RECALCULATE_ANALYTICS",
    );
  });

  it("never proposes a strategic-goal change or a prohibited action", () => {
    expect(evaluateAutomationRule(rule({ actionType: "MODIFY_STRATEGIC_GOAL" }), event, p)).toBeNull();
    expect(evaluateAutomationRule(rule({ actionType: "DELETE_GOAL" }), event, p)).toBeNull();
  });

  it("does nothing for a disabled rule or a non-matching trigger", () => {
    expect(evaluateAutomationRule(rule({ actionType: "SUMMARIZE_TODAY", enabled: false }), event, p)).toBeNull();
    expect(
      evaluateAutomationRule(rule({ actionType: "SUMMARIZE_TODAY", trigger: "WEEKLY_REVIEW" }), event, p),
    ).toBeNull();
  });

  it("respects the policy block-list", () => {
    const blocked = policy({ blockedActions: ["RECALCULATE_ANALYTICS"] });
    expect(evaluateAutomationRule(rule({ actionType: "RECALCULATE_ANALYTICS" }), event, blocked)).toBeNull();
  });
});

describe("minimizeContextForExecutor", () => {
  it("passes only the keys the action needs, nothing else", () => {
    const full = { todayPlan: "x", openTasks: "y", journalEntries: "PRIVATE", finances: "PRIVATE" };
    const minimal = minimizeContextForExecutor(full, action({ actionType: "SUMMARIZE_TODAY" }));
    expect(Object.keys(minimal).sort()).toEqual(["openTasks", "todayPlan"]);
  });

  it("passes nothing for a prohibited action type", () => {
    expect(minimizeContextForExecutor({ a: 1 }, action({ actionType: "MOVE_MONEY" }))).toEqual({});
  });
});

describe("summarizeTelemetry", () => {
  it("computes honest execution metrics, not vanity numbers", () => {
    const history: OpsHistoryEntry[] = [
      { id: "1", correlationId: "c", actionType: "SUMMARIZE_TODAY", source: "automation", status: "COMPLETED", decision: "ALLOW", at: NOW, durationMs: 40, verified: true, rolledBack: false },
      { id: "2", correlationId: "c", actionType: "PREPARE_BRIEFING", source: "user", status: "FAILED", decision: "REQUIRE_APPROVAL", at: NOW, durationMs: 10, verified: false, rolledBack: false },
      { id: "3", correlationId: "c", actionType: "SUMMARIZE_TODAY", source: "automation", status: "ROLLED_BACK", decision: "ALLOW", at: NOW, durationMs: 30, verified: true, rolledBack: true },
    ];
    const summary = summarizeTelemetry(history);
    expect(summary.executed).toBe(3);
    expect(summary.succeeded).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.approvalRate).toBeCloseTo(0.33, 2);
    expect(summary.automationRate).toBeCloseTo(0.67, 2);
    expect(summary.rollbackRate).toBeCloseTo(0.33, 2);
  });
});
