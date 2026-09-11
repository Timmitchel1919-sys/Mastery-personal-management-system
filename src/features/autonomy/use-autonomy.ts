"use client";

import { useCallback, useMemo, useState } from "react";
import type { ActionSource } from "@/features/actions";
import {
  ACTION_CATALOG,
  DEFAULT_AUTONOMY_POLICY,
  advance,
  checkAutomationSafety,
  classifyAction,
  evaluatePolicy,
  runOpsAction,
  summarizeTelemetry,
  verifyOpsAction,
  type AutomationRule,
  type AutonomyPolicy,
  type OpsAction,
  type OpsActionType,
  type OpsCapability,
  type OpsHistoryEntry,
  type TelemetrySummary,
  type TriggerType,
} from "./autonomy-model";

/**
 * Layer R — the autonomy store & runtime.
 *
 * Per-viewer localStorage for the autonomy policy, automation rules, the global
 * emergency-stop flag, the live action queue, and the execution history. It
 * enforces the policy engine and the safety guards before anything runs, verifies
 * every internal execution, and records the outcome. Nothing here mutates a
 * domain repository — internal actions produce a checkable, prepared result and
 * consequential ones stop at approval.
 */

const POLICY_KEY = "mastery.autonomy.policy";
const RULES_KEY = "mastery.autonomy.rules";
const PAUSED_KEY = "mastery.autonomy.paused";
const HISTORY_KEY = "mastery.autonomy.history";
const HISTORY_CAP = 60;

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

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface EnqueueInput {
  actionType: OpsActionType;
  source?: ActionSource;
  title?: string;
  reason: string;
  params?: Record<string, string | number | boolean>;
  dependsOn?: string[];
  chainDepth?: number;
  correlationId?: string;
  idempotencyKey?: string;
  affectedEntities?: string[];
  agentCapabilities?: OpsCapability[];
}

export interface EnqueueResult {
  action: OpsAction | null;
  rejected: string | null;
}

export function useAutonomy() {
  const [policy, setPolicyState] = useState<AutonomyPolicy>(() =>
    readJson<AutonomyPolicy>(POLICY_KEY, DEFAULT_AUTONOMY_POLICY),
  );
  const [rules, setRules] = useState<AutomationRule[]>(() => readJson<AutomationRule[]>(RULES_KEY, []));
  const [paused, setPaused] = useState<boolean>(() => readJson<boolean>(PAUSED_KEY, false));
  const [history, setHistory] = useState<OpsHistoryEntry[]>(() =>
    readJson<OpsHistoryEntry[]>(HISTORY_KEY, []),
  );
  const [queue, setQueue] = useState<OpsAction[]>([]);

  const setPolicy = useCallback((patch: Partial<AutonomyPolicy>) => {
    setPolicyState((current) => {
      const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
      writeJson(POLICY_KEY, next);
      return next;
    });
  }, []);

  const persistRules = useCallback((next: AutomationRule[]) => {
    setRules(next);
    writeJson(RULES_KEY, next);
  }, []);

  const addRule = useCallback(
    (name: string, trigger: TriggerType, actionType: OpsActionType) => {
      persistRules([
        { id: newId("rule"), name: name.trim() || "Automation", trigger, actionType, enabled: true, createdAt: new Date().toISOString() },
        ...rules,
      ]);
    },
    [rules, persistRules],
  );

  const toggleRule = useCallback(
    (id: string) => persistRules(rules.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule))),
    [rules, persistRules],
  );

  const removeRule = useCallback(
    (id: string) => persistRules(rules.filter((rule) => rule.id !== id)),
    [rules, persistRules],
  );

  const pauseAll = useCallback(() => {
    setPaused(true);
    writeJson(PAUSED_KEY, true);
  }, []);

  const resumeAll = useCallback(() => {
    setPaused(false);
    writeJson(PAUSED_KEY, false);
  }, []);

  const appendHistory = useCallback((entry: OpsHistoryEntry) => {
    setHistory((current) => {
      const next = [entry, ...current].slice(0, HISTORY_CAP);
      writeJson(HISTORY_KEY, next);
      return next;
    });
  }, []);

  const enqueue = useCallback(
    (input: EnqueueInput): EnqueueResult => {
      const classification = classifyAction(input.actionType, input.affectedEntities ?? []);
      const now = new Date().toISOString();
      const draft: OpsAction = {
        id: newId("act"),
        correlationId: input.correlationId ?? newId("corr"),
        actionType: input.actionType,
        source: input.source ?? "automation",
        title: input.title ?? ACTION_CATALOG[input.actionType].label,
        reason: input.reason,
        classification,
        status: "PROPOSED",
        policyDecision: null,
        dependsOn: input.dependsOn ?? [],
        chainDepth: input.chainDepth ?? 0,
        idempotencyKey: input.idempotencyKey ?? `${input.actionType}:${input.reason}`,
        params: input.params ?? {},
        createdAt: now,
        decidedAt: null,
        executedAt: null,
        verifiedAt: null,
        result: null,
        failureReason: null,
        rollbackAvailable: classification.reversible,
      };

      const safety = checkAutomationSafety(draft, queue, policy, now);
      if (!safety.ok) {
        return { action: null, rejected: safety.violation.message };
      }

      const decision = evaluatePolicy(policy, classification, {
        paused,
        ...(input.agentCapabilities ? { agentCapabilities: input.agentCapabilities } : {}),
      });
      const validated = advance("PROPOSED", "validate")!;
      const status =
        decision.decision === "DENY"
          ? "REJECTED"
          : decision.decision === "REQUIRE_APPROVAL"
            ? advance(validated, "need-approval")!
            : advance(advance(validated, "authorize")!, "queue")!;

      const action: OpsAction = { ...draft, status, policyDecision: decision, decidedAt: now };
      setQueue((current) => [action, ...current]);

      if (status === "REJECTED") {
        appendHistory({
          id: action.id,
          correlationId: action.correlationId,
          actionType: action.actionType,
          source: action.source,
          status: "REJECTED",
          decision: decision.decision,
          at: now,
          durationMs: 0,
          verified: false,
          rolledBack: false,
          failureReason: decision.reason,
        });
      }

      return { action, rejected: status === "REJECTED" ? decision.reason : null };
    },
    [queue, policy, paused, appendHistory],
  );

  const approve = useCallback((id: string) => {
    setQueue((current) =>
      current.map((action) => {
        if (action.id !== id || action.status !== "WAITING_APPROVAL") return action;
        const authorized = advance("WAITING_APPROVAL", "approve")!;
        return { ...action, status: advance(authorized, "queue")! };
      }),
    );
  }, []);

  const reject = useCallback(
    (id: string) => {
      setQueue((current) =>
        current.map((action) => {
          if (action.id !== id) return action;
          const next = advance(action.status, "reject") ?? advance(action.status, "cancel");
          if (!next) return action;
          appendHistory({
            id: action.id,
            correlationId: action.correlationId,
            actionType: action.actionType,
            source: action.source,
            status: "REJECTED",
            decision: action.policyDecision?.decision ?? null,
            at: new Date().toISOString(),
            durationMs: 0,
            verified: false,
            rolledBack: false,
          });
          return { ...action, status: next };
        }),
      );
    },
    [appendHistory],
  );

  const cancel = useCallback(
    (id: string) => {
      setQueue((current) =>
        current.map((action) => {
          const next = advance(action.status, "cancel");
          if (action.id !== id || !next) return action;
          appendHistory({
            id: action.id,
            correlationId: action.correlationId,
            actionType: action.actionType,
            source: action.source,
            status: "CANCELLED",
            decision: action.policyDecision?.decision ?? null,
            at: new Date().toISOString(),
            durationMs: 0,
            verified: false,
            rolledBack: false,
          });
          return { ...action, status: next };
        }),
      );
    },
    [appendHistory],
  );

  const execute = useCallback(
    (id: string): { ok: boolean; message: string } => {
      const action = queue.find((item) => item.id === id);
      if (!action) return { ok: false, message: "Action not found." };
      if (paused) return { ok: false, message: "Automations are paused." };
      if (action.status !== "QUEUED") {
        return { ok: false, message: `Action is ${action.status}, not queued.` };
      }

      const executing = advance("QUEUED", "start")!;
      const result = runOpsAction(action);
      const verification = verifyOpsAction(action, result);
      const now = new Date().toISOString();

      let finalStatus: OpsAction["status"];
      let failureReason: string | null = null;
      if (!result.ok) {
        finalStatus = "FAILED";
        failureReason = result.output;
      } else if (verification.verified) {
        finalStatus = advance(advance(executing, "verify")!, "complete")!;
      } else {
        finalStatus = "FAILED";
        failureReason = verification.note;
      }

      setQueue((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: finalStatus,
                executedAt: now,
                verifiedAt: verification.verified ? now : null,
                result,
                failureReason,
              }
            : item,
        ),
      );

      appendHistory({
        id: action.id,
        correlationId: action.correlationId,
        actionType: action.actionType,
        source: action.source,
        status: finalStatus,
        decision: action.policyDecision?.decision ?? null,
        at: now,
        durationMs: result.durationMs,
        verified: verification.verified,
        rolledBack: false,
        ...(failureReason ? { failureReason } : {}),
      });

      return { ok: finalStatus === "COMPLETED", message: verification.note || result.output };
    },
    [queue, paused, appendHistory],
  );

  const rollback = useCallback(
    (id: string) => {
      setQueue((current) =>
        current.map((action) => {
          if (action.id !== id) return action;
          if (!action.rollbackAvailable) return action;
          const next = advance(action.status, "rollback");
          if (!next) return action;
          appendHistory({
            id: action.id,
            correlationId: action.correlationId,
            actionType: action.actionType,
            source: action.source,
            status: "ROLLED_BACK",
            decision: action.policyDecision?.decision ?? null,
            at: new Date().toISOString(),
            durationMs: 0,
            verified: false,
            rolledBack: true,
          });
          return { ...action, status: next };
        }),
      );
    },
    [appendHistory],
  );

  const clearCompleted = useCallback(() => {
    setQueue((current) =>
      current.filter(
        (action) => !["COMPLETED", "REJECTED", "CANCELLED", "FAILED", "EXPIRED", "ROLLED_BACK"].includes(action.status),
      ),
    );
  }, []);

  const telemetry: TelemetrySummary = useMemo(() => summarizeTelemetry(history), [history]);

  const pending = useMemo(() => queue.filter((a) => a.status === "WAITING_APPROVAL"), [queue]);
  const running = useMemo(() => queue.filter((a) => a.status === "EXECUTING" || a.status === "QUEUED"), [queue]);
  const failed = useMemo(() => queue.filter((a) => a.status === "FAILED"), [queue]);

  return {
    policy,
    setPolicy,
    rules,
    addRule,
    toggleRule,
    removeRule,
    paused,
    pauseAll,
    resumeAll,
    queue,
    pending,
    running,
    failed,
    history,
    telemetry,
    enqueue,
    approve,
    reject,
    cancel,
    execute,
    rollback,
    clearCompleted,
  };
}
