"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button, GlassCard, Spinner } from "@/components/ui";
import { RISK_LABEL, type ProposedAction } from "../action-model";
import { useActionRunner } from "../use-action-runner";

const RISK_TONE: Record<ProposedAction["risk"], string> = {
  low: "text-muted",
  medium: "text-primary",
  high: "text-warning",
};

interface ActionPreviewCardProps {
  action: ProposedAction;
  /** Live signature of the target — enables stale detection. */
  currentSignature?: string;
  /** Called when the user asks to refresh a stale recommendation. */
  onRefresh?: () => void;
  onCompleted?: () => void;
  className?: string;
}

/**
 * Shows exactly what a `ProposedAction` will change and lets the user apply or
 * cancel it — the approval gate in the execution loop. Also renders the applied,
 * failed, and stale states. Nothing here mutates data directly; it calls
 * `useActionRunner`, which calls the action's own `execute()`.
 */
export function ActionPreviewCard({
  action,
  currentSignature,
  onRefresh,
  onCompleted,
  className,
}: ActionPreviewCardProps) {
  const runner = useActionRunner(action, { currentSignature, onCompleted });

  return (
    <GlassCard variant="gold-accent" className={className}>
      <div className="space-y-3">
        <p className="text-eyebrow flex items-center gap-1.5">
          <Sparkles className="size-3.5" aria-hidden="true" />
          {action.source === "ai" ? "Mastery recommends" : "Proposed change"}
        </p>

        <div className="flex items-start justify-between gap-3">
          <p className="text-foreground text-base font-semibold tracking-tight">{action.title}</p>
          <span className={`shrink-0 text-xs font-medium ${RISK_TONE[action.risk]}`}>
            {RISK_LABEL[action.risk]}
          </span>
        </div>

        {action.preview.length > 0 ? (
          <ul className="border-border divide-border divide-y rounded-lg border text-sm">
            {action.preview.map((line, index) => (
              <li key={index} className="flex flex-wrap items-center gap-x-2 gap-y-1 p-3">
                <span className="text-subtle min-w-24 font-medium">{line.label}</span>
                {line.from !== undefined ? (
                  <>
                    <span className="text-muted line-through">{line.from}</span>
                    <ArrowRight className="text-subtle size-3.5" aria-hidden="true" />
                  </>
                ) : null}
                {line.to !== undefined ? (
                  <span className="text-foreground font-medium">{line.to}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        <p className="text-muted text-sm leading-relaxed">
          <span className="text-subtle text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
            Why{" "}
          </span>
          {action.reason}
        </p>

        {runner.stale ? (
          <div className="border-warning/40 bg-warning/10 flex flex-col gap-2 rounded-lg border p-3">
            <p className="text-foreground flex items-center gap-1.5 text-sm font-medium">
              <AlertTriangle className="text-warning size-4" aria-hidden="true" />
              This recommendation is no longer current
            </p>
            <p className="text-muted text-sm">The target changed since this was suggested.</p>
            {onRefresh ? (
              <Button size="sm" variant="secondary" className="self-start" onClick={onRefresh}>
                Refresh
              </Button>
            ) : null}
          </div>
        ) : runner.status === "failed" ? (
          <div className="space-y-2" role="alert">
            <p className="text-foreground flex items-center gap-1.5 text-sm font-medium">
              <XCircle className="text-danger size-4" aria-hidden="true" />
              Change not applied
            </p>
            {runner.issues.length > 0 ? (
              <ul className="text-muted list-disc space-y-0.5 pl-5 text-sm">
                {runner.issues.map((issue) => (
                  <li key={issue.code}>{issue.message}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted text-sm">
                {runner.error ?? "Mastery couldn't apply this change."}
              </p>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={runner.retry}>
                Try again
              </Button>
              <Button size="sm" variant="ghost" onClick={runner.cancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : runner.status === "completed" ? (
          <div className="space-y-2" aria-live="polite">
            <p className="text-foreground flex items-center gap-1.5 text-sm font-medium">
              <CheckCircle2 className="text-success size-4" aria-hidden="true" />
              Change applied
            </p>
            <div className="flex flex-wrap gap-2">
              {runner.canUndo ? (
                <Button size="sm" variant="secondary" onClick={runner.undo}>
                  <RotateCcw aria-hidden="true" />
                  Undo
                </Button>
              ) : null}
              {action.viewHref ? (
                <Button asChild size="sm" variant="ghost">
                  <Link href={action.viewHref}>View</Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : runner.status === "cancelled" ? (
          <p className="text-subtle text-sm">Cancelled — nothing was changed.</p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={runner.approve} loading={runner.status === "executing"}>
              Apply change
            </Button>
            <Button variant="ghost" onClick={runner.cancel} disabled={runner.status === "executing"}>
              Cancel
            </Button>
            {runner.status === "executing" ? (
              <span className="text-subtle inline-flex items-center gap-1.5 text-sm">
                <Spinner className="size-3.5" />
                Applying…
              </span>
            ) : null}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
