"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { normalizeError } from "@/lib/errors";
import { recordAction } from "../action-history";
import { RISK_LABEL, type ActionRecord, type ProposedAction } from "../action-model";

type RowStatus = "pending" | "running" | "done" | "failed" | "skipped";

interface ActionReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: ProposedAction[];
  /** Optional live signatures by action id — rows whose target moved are skipped. */
  signatures?: Record<string, string>;
  onAllDone?: () => void;
}

/**
 * Groups several `ProposedAction`s into one review. The user picks which to
 * apply — "Apply all", "Apply selected", or "Cancel" — and they run in order,
 * each validated and each recorded. Nothing runs on open.
 */
export function ActionReviewDialog({
  open,
  onOpenChange,
  actions,
  signatures,
  onAllDone,
}: ActionReviewDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(actions.map((a) => a.id)));
  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({});
  const [running, setRunning] = useState(false);

  const finished = useMemo(
    () => actions.every((action) => ["done", "failed", "skipped"].includes(rowStatus[action.id] ?? "")),
    [actions, rowStatus],
  );

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function run(ids: string[]) {
    setRunning(true);
    for (const action of actions) {
      if (!ids.includes(action.id)) continue;

      const sig = signatures?.[action.id];
      if (sig !== undefined && action.targetSignature !== undefined && sig !== action.targetSignature) {
        setRowStatus((s) => ({ ...s, [action.id]: "skipped" }));
        continue;
      }

      setRowStatus((s) => ({ ...s, [action.id]: "running" }));
      try {
        if (action.validate) {
          const result = await action.validate();
          if (!result.ok) {
            setRowStatus((s) => ({ ...s, [action.id]: "failed" }));
            recordAction(record(action, "failed", result.issues[0]?.message));
            continue;
          }
        }
        await action.execute();
        setRowStatus((s) => ({ ...s, [action.id]: "done" }));
        recordAction(record(action, "completed"));
      } catch (caught) {
        setRowStatus((s) => ({ ...s, [action.id]: "failed" }));
        recordAction(record(action, "failed", normalizeError(caught).message));
      }
    }
    setRunning(false);
    onAllDone?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Mastery recommends {actions.length} change{actions.length === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>
            Review each one. Nothing is applied until you choose to.
          </DialogDescription>
        </DialogHeader>

        <ul className="divide-border max-h-[50vh] divide-y overflow-y-auto">
          {actions.map((action) => {
            const state = rowStatus[action.id] ?? "pending";
            return (
              <li key={action.id} className="flex items-start gap-3 py-3">
                <Checkbox
                  checked={selected.has(action.id)}
                  onCheckedChange={() => toggle(action.id)}
                  disabled={running || finished}
                  aria-label={`Include: ${action.title}`}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm font-medium">{action.title}</p>
                  {action.preview[0] ? (
                    <p className="text-muted mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
                      <span>{action.preview[0].label}</span>
                      {action.preview[0].from ? (
                        <>
                          <span className="line-through">{action.preview[0].from}</span>
                          <ArrowRight className="size-3" aria-hidden="true" />
                        </>
                      ) : null}
                      {action.preview[0].to ? <span>{action.preview[0].to}</span> : null}
                    </p>
                  ) : null}
                  <p className="text-subtle mt-0.5 text-xs">{RISK_LABEL[action.risk]}</p>
                </div>
                <span className="mt-0.5 shrink-0 text-xs">
                  {state === "done" ? (
                    <CheckCircle2 className="text-success size-4" aria-label="Applied" />
                  ) : state === "failed" ? (
                    <XCircle className="text-danger size-4" aria-label="Failed" />
                  ) : state === "skipped" ? (
                    <span className="text-warning">Skipped</span>
                  ) : state === "running" ? (
                    <span className="text-muted">…</span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>

        <DialogFooter>
          {finished ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={running}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                disabled={running || selected.size === 0}
                onClick={() => run([...selected])}
              >
                Apply selected ({selected.size})
              </Button>
              <Button
                disabled={running}
                onClick={() => run(actions.map((a) => a.id))}
              >
                Apply all
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function record(
  action: ProposedAction,
  status: "completed" | "failed",
  error?: string,
): ActionRecord {
  return {
    id: action.id,
    kind: action.kind,
    title: action.title,
    source: action.source,
    status,
    at: new Date().toISOString(),
    ...(error ? { error } : {}),
  };
}
