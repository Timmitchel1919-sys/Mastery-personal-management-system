"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, OctagonPause, Play, Plus, ShieldCheck, X } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { Button, Input, Switch } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  ACTION_CATALOG,
  AUTONOMY_LEVEL_META,
  AUTOMATABLE_ACTION_TYPES,
  OPS_STATUS_LABEL,
  type AutonomyLevel,
  type OpsAction,
  type OpsActionType,
  type OpsActionStatus,
  type TriggerType,
} from "../autonomy-model";
import { ApprovalCard } from "./ApprovalCard";
import { useAutonomy } from "../use-autonomy";

const LEVELS: AutonomyLevel[] = [0, 1, 2, 3, 4, 5];
const TRIGGERS: TriggerType[] = [
  "TASK_COMPLETED",
  "DEADLINE_NEAR",
  "TIME_MORNING",
  "WEEKLY_REVIEW",
  "STATUS_CHANGE",
  "THRESHOLD",
];

const STATUS_STYLE: Partial<Record<OpsActionStatus, string>> = {
  COMPLETED: "text-success",
  FAILED: "text-danger",
  REJECTED: "text-danger",
  CANCELLED: "text-muted",
  WAITING_APPROVAL: "text-warning",
  EXECUTING: "text-primary",
  ROLLED_BACK: "text-muted",
};

function Panel({
  id,
  title,
  icon,
  description,
  children,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="mastery-panel space-y-4 rounded-2xl p-5">
      <div className="space-y-1">
        <h2 id={`${id}-heading`} className="text-eyebrow flex items-center gap-1.5">
          {icon}
          {title}
        </h2>
        {description ? <p className="text-subtle text-xs">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

type Perm = "allow" | "approval" | "block";

function permFor(
  actionType: OpsActionType,
  policy: ReturnType<typeof useAutonomy>["policy"],
): Perm {
  if (policy.blockedActions.includes(actionType)) return "block";
  if (policy.allowedActions.includes(actionType)) return "allow";
  return "approval";
}

function QueueRow({ action, onCancel }: { action: OpsAction; onCancel: () => void }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2 text-sm">
      <div className="min-w-0">
        <p className="text-foreground truncate">{action.title}</p>
        <p className="text-subtle text-xs">
          {action.source} · {action.reason}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={cn("text-xs font-medium", STATUS_STYLE[action.status] ?? "text-muted")}>
          {OPS_STATUS_LABEL[action.status]}
        </span>
        {advanceable(action.status) ? (
          <button type="button" onClick={onCancel} aria-label={`Cancel ${action.title}`} className="text-subtle hover:text-danger">
            <X className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </li>
  );
}

function advanceable(status: OpsActionStatus): boolean {
  return !["COMPLETED", "REJECTED", "CANCELLED", "FAILED", "EXPIRED", "ROLLED_BACK"].includes(status);
}

export function TrustCenterView() {
  const {
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
  } = useAutonomy();

  const [ruleName, setRuleName] = useState("");
  const [ruleTrigger, setRuleTrigger] = useState<TriggerType>("TIME_MORNING");
  const [ruleAction, setRuleAction] = useState<OpsActionType>("PREPARE_BRIEFING");

  const setPerm = (actionType: OpsActionType, perm: Perm) => {
    setPolicy({
      allowedActions:
        perm === "allow"
          ? [...new Set([...policy.allowedActions, actionType])]
          : policy.allowedActions.filter((t) => t !== actionType),
      blockedActions:
        perm === "block"
          ? [...new Set([...policy.blockedActions, actionType])]
          : policy.blockedActions.filter((t) => t !== actionType),
    });
  };

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Trust Center"
        description="What MASTERY is allowed to do — and proof of what it has done. Autonomy is bounded, transparent, and yours to control."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          paused ? (
            <Button size="sm" onClick={resumeAll}>
              <Play className="size-3.5" aria-hidden="true" />
              Resume automations
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={pauseAll}>
              <OctagonPause className="size-3.5" aria-hidden="true" />
              Pause all automations
            </Button>
          )
        }
      />

      {paused ? (
        <div
          role="status"
          className="border-warning/40 bg-warning/10 text-warning flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold"
        >
          <OctagonPause className="size-4" aria-hidden="true" />
          Emergency stop is active — no autonomous action will run.
        </div>
      ) : null}

      <div className="mastery-panel flex flex-wrap gap-x-6 gap-y-2 rounded-2xl p-4 text-sm">
        {[
          ["Autonomy level", AUTONOMY_LEVEL_META[policy.autonomyLevel].label],
          ["Pending approvals", pending.length],
          ["Running", running.length],
          ["Failed", failed.length],
          ["Actions executed", telemetry.executed],
          ["Rollback rate", `${Math.round(telemetry.rollbackRate * 100)}%`],
        ].map(([label, value]) => (
          <span key={label} className="flex items-baseline gap-1.5">
            <span className="text-subtle text-[0.6875rem] tracking-[0.08em] uppercase">{label}</span>
            <span className="text-foreground font-semibold">{value}</span>
          </span>
        ))}
      </div>

      <Panel
        id="autonomy"
        title="Autonomy level"
        icon={<ShieldCheck className="size-3.5" aria-hidden="true" />}
        description="The ceiling on what MASTERY may do without asking. Authorization is never inferred from your behaviour."
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((level) => {
            const meta = AUTONOMY_LEVEL_META[level];
            const active = policy.autonomyLevel === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => setPolicy({ autonomyLevel: level })}
                aria-pressed={active}
                className={cn(
                  "rounded-xl border p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "border-border-gold bg-surface" : "border-border hover:bg-surface/50",
                )}
              >
                <p className="text-foreground text-sm font-semibold">
                  {level} · {meta.label}
                </p>
                <p className="text-muted text-xs">{meta.description}</p>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel
        id="permissions"
        title="Agent permissions"
        description="Per action type: allow low-risk auto-execution, require approval, or block entirely. Consequential and prohibited types can never auto-run."
      >
        <ul className="divide-border divide-y">
          {(Object.keys(ACTION_CATALOG) as OpsActionType[]).map((actionType) => {
            const entry = ACTION_CATALOG[actionType];
            const current = permFor(actionType, policy);
            const lockedToApproval = entry.prohibited || !entry.internallyExecutable;
            return (
              <li key={actionType} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="text-foreground text-sm">{entry.label}</p>
                  <p className="text-subtle text-[0.6875rem] tracking-[0.08em] uppercase">
                    {entry.defaultRisk} risk · {entry.reversible ? "reversible" : "irreversible"}
                    {entry.prohibited ? " · prohibited" : ""}
                  </p>
                </div>
                <div className="flex gap-1" role="group" aria-label={`Permission for ${entry.label}`}>
                  {(["allow", "approval", "block"] as Perm[]).map((perm) => {
                    const disabled = perm === "allow" && lockedToApproval;
                    return (
                      <button
                        key={perm}
                        type="button"
                        disabled={disabled}
                        aria-pressed={current === perm}
                        onClick={() => setPerm(actionType, perm)}
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40",
                          current === perm ? "border-border-gold bg-surface text-foreground" : "border-border text-muted",
                        )}
                      >
                        {perm}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      {pending.length > 0 ? (
        <Panel id="approvals" title={`Pending approvals (${pending.length})`} icon={<AlertTriangle className="size-3.5" aria-hidden="true" />}>
          <div className="space-y-3">
            {pending.map((action) => (
              <ApprovalCard
                key={action.id}
                action={action}
                onApprove={() => approve(action.id)}
                onReject={() => reject(action.id)}
              />
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel
        id="queue"
        title={`Execution queue (${queue.length})`}
        description="Every queued and recent action. Queued low-risk actions can be run; anything can be cancelled."
      >
        {queue.length === 0 ? (
          <p className="text-muted text-sm">Nothing in the queue.</p>
        ) : (
          <ul className="divide-border divide-y">
            {queue.map((action) => (
              <li key={action.id} className="space-y-1 py-1">
                <QueueRow action={action} onCancel={() => cancel(action.id)} />
                <div className="flex flex-wrap gap-2 pl-0 text-xs">
                  {action.status === "QUEUED" ? (
                    <button type="button" className="text-primary hover:underline" onClick={() => execute(action.id)}>
                      Run now
                    </button>
                  ) : null}
                  {action.status === "COMPLETED" && action.rollbackAvailable ? (
                    <button type="button" className="text-muted hover:text-foreground" onClick={() => rollback(action.id)}>
                      Roll back
                    </button>
                  ) : null}
                  {action.status === "FAILED" ? (
                    <span className="text-danger">{action.failureReason}</span>
                  ) : null}
                  {action.result?.output && action.status === "COMPLETED" ? (
                    <span className="text-subtle">{action.result.output}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        {queue.some((a) => !advanceable(a.status)) ? (
          <Button size="sm" variant="ghost" onClick={clearCompleted}>
            Clear finished
          </Button>
        ) : null}
      </Panel>

      <Panel
        id="rules"
        title={`Automation rules (${rules.length})`}
        description="WHEN a trigger fires, THEN propose an action — routed through the same policy engine. Rules can never touch strategic goals or anything prohibited."
      >
        <div className="border-border flex flex-wrap items-end gap-2 rounded-xl border p-3">
          <Input
            value={ruleName}
            onChange={(event) => setRuleName(event.target.value)}
            placeholder="Rule name"
            aria-label="Rule name"
            className="max-w-[12rem]"
          />
          <label className="text-muted flex flex-col gap-1 text-xs">
            When
            <select
              value={ruleTrigger}
              onChange={(event) => setRuleTrigger(event.target.value as TriggerType)}
              className="border-border bg-surface rounded-md border px-2 py-1 text-sm"
              aria-label="Trigger"
            >
              {TRIGGERS.map((trigger) => (
                <option key={trigger} value={trigger}>
                  {trigger}
                </option>
              ))}
            </select>
          </label>
          <label className="text-muted flex flex-col gap-1 text-xs">
            Then propose
            <select
              value={ruleAction}
              onChange={(event) => setRuleAction(event.target.value as OpsActionType)}
              className="border-border bg-surface rounded-md border px-2 py-1 text-sm"
              aria-label="Action"
            >
              {AUTOMATABLE_ACTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {ACTION_CATALOG[type].label}
                </option>
              ))}
            </select>
          </label>
          <Button
            size="sm"
            onClick={() => {
              addRule(ruleName, ruleTrigger, ruleAction);
              setRuleName("");
            }}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add rule
          </Button>
        </div>

        {rules.length === 0 ? (
          <p className="text-muted text-sm">No automation rules yet.</p>
        ) : (
          <ul className="divide-border divide-y">
            {rules.map((rule) => (
              <li key={rule.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="text-foreground truncate">{rule.name}</p>
                  <p className="text-subtle text-xs">
                    {rule.trigger} → {ACTION_CATALOG[rule.actionType].label}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                    aria-label={`Enable ${rule.name}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeRule(rule.id)}
                    aria-label={`Delete ${rule.name}`}
                    className="text-subtle hover:text-danger"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-subtle text-xs">
          Rules propose actions; they do not bypass approval. To let one run without asking,
          also set that action type to <em>allow</em> above and raise the autonomy level to 3+.
        </p>
      </Panel>

      <Panel id="history" title={`Execution history (${history.length})`} description="A local record of what MASTERY did — decision, result, verification, rollback.">
        {history.length === 0 ? (
          <p className="text-muted text-sm">No executions recorded yet.</p>
        ) : (
          <ul className="divide-border divide-y">
            {history.slice(0, 20).map((entry) => (
              <li key={`${entry.id}-${entry.at}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="text-foreground truncate">{ACTION_CATALOG[entry.actionType].label}</p>
                  <p className="text-subtle text-xs">
                    {entry.at.slice(0, 16).replace("T", " ")} · {entry.source} · {entry.decision ?? "—"}
                    {entry.failureReason ? ` · ${entry.failureReason}` : ""}
                  </p>
                </div>
                <span className={cn("shrink-0 text-xs font-medium", STATUS_STYLE[entry.status] ?? "text-muted")}>
                  {OPS_STATUS_LABEL[entry.status]}
                  {entry.verified ? " ✓" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <p className="text-subtle text-xs">
        Simulations run in the{" "}
        <Link href="/simulation" className="text-primary hover:underline">
          Digital Twin
        </Link>{" "}
        and never touch production. A consequential action goes: proposal → policy → your
        approval → execution → verification. You are always the authority.
      </p>

      {/* Dev affordance: enqueue a sample low-risk action to see the flow. */}
      <Button
        size="sm"
        variant="secondary"
        onClick={() => enqueue({ actionType: "SUMMARIZE_TODAY", source: "user", reason: "Manually requested from the Trust Center" })}
      >
        Propose “Summarise today”
      </Button>
    </PageContainer>
  );
}
