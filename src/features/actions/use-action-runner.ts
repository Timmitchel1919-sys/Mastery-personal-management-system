"use client";

import { useCallback, useMemo, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { recordAction } from "./action-history";
import {
  isStale,
  type ActionStatus,
  type ProposedAction,
  type ValidationIssue,
} from "./action-model";

interface UseActionRunnerOptions {
  /** The target's live signature — compared against the action's to spot staleness. */
  currentSignature?: string;
  onCompleted?: () => void;
}

/**
 * Drives one `ProposedAction` through the execution loop:
 *
 *   proposed → approved → executing → completed | failed
 *                                   ↘ cancelled
 *
 * Nothing runs without `approve()` (human-in-the-loop). `approve()` refuses a
 * stale action, runs `validate()` first, executes through the feature's own
 * hook, records the outcome, and only reports success when the mutation
 * actually resolved. `undo()` is available only when the action supplied one.
 */
export function useActionRunner(action: ProposedAction, options: UseActionRunnerOptions = {}) {
  const [status, setStatus] = useState<ActionStatus>("proposed");
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);

  const stale = useMemo(
    () => isStale(action, options.currentSignature),
    [action, options.currentSignature],
  );

  const approve = useCallback(async () => {
    if (stale || status === "executing") return;
    setError(null);
    setIssues([]);
    setStatus("approved");

    if (action.validate) {
      const result = await action.validate();
      if (!result.ok) {
        setIssues(result.issues);
        setStatus("failed");
        return;
      }
    }

    setStatus("executing");
    try {
      await action.execute();
      recordAction({
        id: action.id,
        kind: action.kind,
        title: action.title,
        source: action.source,
        status: "completed",
        at: new Date().toISOString(),
      });
      setStatus("completed");
      options.onCompleted?.();
    } catch (caught) {
      const message = normalizeError(caught).message;
      setError(message);
      recordAction({
        id: action.id,
        kind: action.kind,
        title: action.title,
        source: action.source,
        status: "failed",
        at: new Date().toISOString(),
        error: message,
      });
      setStatus("failed");
    }
  }, [action, options, stale, status]);

  const cancel = useCallback(() => {
    recordAction({
      id: action.id,
      kind: action.kind,
      title: action.title,
      source: action.source,
      status: "cancelled",
      at: new Date().toISOString(),
    });
    setStatus("cancelled");
  }, [action]);

  const retry = useCallback(() => {
    setError(null);
    setIssues([]);
    setStatus("proposed");
  }, []);

  const undo = useCallback(async () => {
    if (!action.undo || status !== "completed") return;
    setStatus("executing");
    try {
      await action.undo();
      setStatus("proposed");
    } catch (caught) {
      setError(normalizeError(caught).message);
      setStatus("completed");
    }
  }, [action, status]);

  return {
    status,
    error,
    issues,
    stale,
    canUndo: Boolean(action.undo) && status === "completed",
    approve,
    cancel,
    retry,
    undo,
  };
}
