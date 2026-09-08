import type { Priority } from "@/lib/validation/domain";
import { isClosed, type Task } from "@/features/tasks/schema";

/**
 * The Mastery action model. A `ProposedAction` describes a change Mastery could
 * make — its intent, target, the exact before/after, and why — but never applies
 * it. Execution runs only after `approve()` in `useActionRunner`, through the
 * feature's own mutation hooks. AI never mutates state directly.
 *
 * Pure module — no React, no I/O. Covered by action-model.test.ts.
 */

export type ActionStatus =
  | "proposed"
  | "approved"
  | "executing"
  | "completed"
  | "failed"
  | "cancelled";

export type ActionSource = "ai" | "user" | "automation";

/** Consequence tier — drives the confirmation weight and the badge. */
export type ActionRisk = "low" | "medium" | "high";

export const RISK_LABEL: Record<ActionRisk, string> = {
  low: "Low impact",
  medium: "Changes your plan",
  high: "Significant change",
};

/** One before → after line in an action preview. */
export interface PreviewLine {
  label: string;
  from?: string;
  to?: string;
}

export interface ValidationIssue {
  code: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

export function validationOk(): ValidationResult {
  return { ok: true, issues: [] };
}

export function validationFail(issues: ValidationIssue[]): ValidationResult {
  return { ok: issues.length === 0, issues };
}

export interface ProposedAction {
  id: string;
  /** Machine kind, e.g. "reschedule-task", "start-task", "create-focus-block". */
  kind: string;
  /** Human summary of the change, e.g. `Move "Finalise docs" to tomorrow`. */
  title: string;
  reason: string;
  risk: ActionRisk;
  source: ActionSource;
  preview: PreviewLine[];
  /** A cheap fingerprint of the target's current state, for stale detection. */
  targetSignature?: string;
  /** Optional pre-flight check run before `execute`. */
  validate?: () => ValidationResult | Promise<ValidationResult>;
  /** Applies the change via the feature's real mutation hook. */
  execute: () => Promise<void>;
  /** Reverses the change to the captured previous state — only when reversible. */
  undo?: () => Promise<void>;
  /** A route the confirmation can link to, e.g. "/act/tasks". */
  viewHref?: string;
}

export interface ActionRecord {
  id: string;
  kind: string;
  title: string;
  source: ActionSource;
  status: "completed" | "failed" | "cancelled";
  at: string;
  error?: string;
}

/**
 * True when the target changed since the action was proposed — the caller should
 * refresh rather than apply a stale recommendation. If either signature is
 * unknown we cannot tell, so we do not block.
 */
export function isStale(
  action: Pick<ProposedAction, "targetSignature">,
  currentSignature: string | undefined,
): boolean {
  if (action.targetSignature === undefined || currentSignature === undefined) return false;
  return action.targetSignature !== currentSignature;
}

// ── Next Best Action ────────────────────────────────────────────────────────

const PRIORITY_RANK: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export interface NextBestTask {
  task: Task;
  /** Plain-language reasons this rose to the top — never a black-box score. */
  why: string[];
}

function daysUntil(dateIso: string, todayIso: string): number | null {
  const then = Date.parse(dateIso);
  const now = Date.parse(todayIso);
  if (Number.isNaN(then) || Number.isNaN(now)) return null;
  return Math.round((then - now) / 86_400_000);
}

/**
 * Deterministically pick the single task most worth doing next: open tasks only,
 * ordered by priority, then by due-date proximity (overdue first), then by the
 * lightest estimate. Returns `null` when there is nothing open. No hidden score —
 * the same inputs always yield the same pick, and `why` explains it.
 */
export function pickNextBestTask(tasks: Task[], todayIso: string): NextBestTask | null {
  const open = tasks.filter((task) => !isClosed(task.taskStatus));
  if (open.length === 0) return null;

  const sorted = [...open].sort((a, b) => {
    const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (byPriority !== 0) return byPriority;

    const aDue = a.dueDate ? (daysUntil(a.dueDate, todayIso) ?? Infinity) : Infinity;
    const bDue = b.dueDate ? (daysUntil(b.dueDate, todayIso) ?? Infinity) : Infinity;
    if (aDue !== bDue) return aDue - bDue;

    return a.estimatedMinutes - b.estimatedMinutes;
  });

  const task = sorted[0]!;
  const why: string[] = [];

  if (task.priority === "critical" || task.priority === "high") {
    why.push(`${task.priority === "critical" ? "Critical" : "High"} priority`);
  }
  if (task.dueDate) {
    const days = daysUntil(task.dueDate, todayIso);
    if (days !== null) {
      if (days < 0) why.push(`Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`);
      else if (days === 0) why.push("Due today");
      else why.push(`Due in ${days} day${days === 1 ? "" : "s"}`);
    }
  }
  if (task.estimatedMinutes > 0) why.push(`Estimated ${task.estimatedMinutes} min`);
  if (task.goalId) why.push("Linked to a goal");
  if (why.length === 0) why.push("Next open task by priority");

  return { task, why };
}
