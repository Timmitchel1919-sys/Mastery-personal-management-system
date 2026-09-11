"use client";

import { useCallback, useMemo, useState } from "react";
import { useAutonomy, type OpsActionType } from "@/features/autonomy";
import {
  appendAuditEvent,
  detectActionConflicts,
  evaluateCircuitBreaker,
  evaluateGateway,
  verifyAuditIntegrity,
  type AuditEvent,
  type AuditEventType,
  type AutonomyCondition,
  type ConditionalAutonomyRule,
  type GatewayResult,
} from "./governance-model";
import { parseAutomationRequest, reviseDraft, testPolicyDraft, type PolicyDraft } from "./automation-policy";

const RULES_KEY = "mastery.governance.conditional-rules";
const AUDIT_KEY = "mastery.governance.audit";
const DRAFTS_KEY = "mastery.governance.policy-drafts";

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // per-viewer convenience only
  }
}

/**
 * Layer V — the governance runtime.
 *
 * Composes Layer R's `useAutonomy` (policy, queue, history, pause flag) and
 * layers the Level-4 conditional-autonomy rules, the conflict + circuit-
 * breaker checks, and the tamper-evident audit chain on top — through the
 * single `submit` entry point (`evaluateGateway`). It never bypasses R's own
 * policy engine or execution path.
 */
export function useGovernance() {
  const autonomy = useAutonomy();

  const [conditionalRules, setConditionalRules] = useState<ConditionalAutonomyRule[]>(() =>
    readJson<ConditionalAutonomyRule[]>(RULES_KEY, []),
  );
  const [audit, setAudit] = useState<AuditEvent[]>(() => readJson<AuditEvent[]>(AUDIT_KEY, []));
  const [drafts, setDrafts] = useState<PolicyDraft[]>(() => readJson<PolicyDraft[]>(DRAFTS_KEY, []));

  const persistRules = useCallback((next: ConditionalAutonomyRule[]) => {
    setConditionalRules(next);
    writeJson(RULES_KEY, next);
  }, []);

  const persistDrafts = useCallback((next: PolicyDraft[]) => {
    setDrafts(next);
    writeJson(DRAFTS_KEY, next);
  }, []);

  const record = useCallback((type: AuditEventType, summary: string) => {
    setAudit((current) => {
      const next = appendAuditEvent(current, type, summary, new Date().toISOString());
      writeJson(AUDIT_KEY, next);
      return next;
    });
  }, []);

  const addConditionalRule = useCallback(
    (actionType: OpsActionType, condition: AutonomyCondition) => {
      const rule: ConditionalAutonomyRule = {
        id: `cond-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        actionType,
        condition,
        enabled: true,
        createdAt: new Date().toISOString(),
      };
      persistRules([rule, ...conditionalRules]);
      record("POLICY_CHANGED", `Added a Level 4 condition for ${actionType}.`);
    },
    [conditionalRules, persistRules, record],
  );

  const toggleConditionalRule = useCallback(
    (id: string) => {
      persistRules(conditionalRules.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)));
      record("POLICY_CHANGED", "Toggled a Level 4 condition.");
    },
    [conditionalRules, persistRules, record],
  );

  const removeConditionalRule = useCallback(
    (id: string) => {
      persistRules(conditionalRules.filter((rule) => rule.id !== id));
      record("POLICY_CHANGED", "Removed a Level 4 condition.");
    },
    [conditionalRules, persistRules, record],
  );

  const conflicts = useMemo(() => detectActionConflicts(autonomy.queue), [autonomy.queue]);

  const circuitBreakers = useMemo(() => {
    const types = new Set(autonomy.queue.map((action) => action.actionType));
    return [...types]
      .map((type) => ({ actionType: type, ...evaluateCircuitBreaker(autonomy.history, type) }))
      .filter((entry) => entry.tripped);
  }, [autonomy.queue, autonomy.history]);

  /** The one controlled entry point — mirrors `useAutonomy().enqueue` but
   * additionally applies the conflict, circuit-breaker, and Level-4 checks
   * before deciding, and records an audit event either way. */
  const submit = useCallback(
    (
      actionType: OpsActionType,
      reason: string,
      affectedEntities: string[] = [],
      confidence?: "high" | "medium" | "low",
    ): GatewayResult => {
      const result = evaluateGateway(actionType, affectedEntities, {
        policy: autonomy.policy,
        paused: autonomy.paused,
        existingActions: autonomy.queue,
        history: autonomy.history,
        conditionalRules,
        ...(confidence ? { confidence } : {}),
      });

      record("ACTION_PROPOSED", `${actionType}: ${result.decision} — ${result.reason}`);

      if (result.decision === "ALLOW" || result.decision === "ALLOW_CONDITIONAL") {
        autonomy.enqueue({ actionType, reason, affectedEntities, source: "automation" });
        record("ACTION_APPROVED", `${actionType} auto-approved (${result.decision}).`);
      } else if (result.decision === "DENY") {
        record("ACTION_REJECTED", `${actionType} denied: ${result.reason}`);
      } else if (result.decision === "REQUIRE_APPROVAL") {
        autonomy.enqueue({ actionType, reason, affectedEntities, source: "automation" });
      }

      return result;
    },
    [autonomy, conditionalRules, record],
  );

  const createDraft = useCallback(
    (phrase: string) => {
      const draft = parseAutomationRequest(phrase);
      if (draft) persistDrafts([draft, ...drafts]);
      return draft;
    },
    [drafts, persistDrafts],
  );

  const reviseDraftById = useCallback(
    (id: string, patch: Parameters<typeof reviseDraft>[1]) => {
      const existing = drafts.find((draft) => draft.id === id);
      if (!existing) return;
      const revised = reviseDraft(existing, patch, new Date().toISOString());
      persistDrafts([revised, ...drafts.filter((draft) => draft.id !== id)]);
      record("POLICY_CHANGED", `Revised "${existing.name}" to v${revised.version}.`);
    },
    [drafts, persistDrafts, record],
  );

  const activateDraft = useCallback(
    (id: string) => {
      const draft = drafts.find((entry) => entry.id === id);
      if (!draft) return;
      autonomy.addRule(draft.name, draft.trigger, draft.actionType);
      record("POLICY_CHANGED", `Activated automation "${draft.name}".`);
    },
    [drafts, autonomy, record],
  );

  const auditIntegrity = useMemo(() => verifyAuditIntegrity(audit), [audit]);

  const pauseAll = useCallback(() => {
    autonomy.pauseAll();
    record("AUTONOMY_PAUSED", "Global automation kill switch activated.");
  }, [autonomy, record]);

  return {
    autonomy,
    conditionalRules,
    addConditionalRule,
    toggleConditionalRule,
    removeConditionalRule,
    conflicts,
    circuitBreakers,
    submit,
    drafts,
    createDraft,
    reviseDraftById,
    activateDraft,
    testDraft: testPolicyDraft,
    audit,
    auditIntegrity,
    pauseAll,
  };
}
