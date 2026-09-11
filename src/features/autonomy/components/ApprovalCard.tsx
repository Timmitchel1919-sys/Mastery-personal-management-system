"use client";

import { Button, GlassCard } from "@/components/ui";
import { cn } from "@/lib/utils";
import { RISK_LABEL, type OpsAction, type OpsRiskLevel } from "../autonomy-model";

const RISK_STYLE: Record<OpsRiskLevel, string> = {
  low: "text-muted",
  medium: "text-primary",
  high: "text-warning",
  critical: "text-danger",
};

interface ApprovalCardProps {
  action: OpsAction;
  onApprove: () => void;
  onReject: () => void;
  onEdit?: () => void;
  className?: string;
}

/**
 * The standardised approval gate. Shows the action, why, what it affects, the
 * expected result, its risk, whether it can be reversed, and who would run it —
 * nothing important hidden. Approval is always an explicit click.
 */
export function ApprovalCard({ action, onApprove, onReject, onEdit, className }: ApprovalCardProps) {
  const rows: Array<[string, string]> = [
    ["Action", action.title],
    ["Why", action.reason],
    ["Affected data", action.classification.affectedEntities.join(", ") || "None recorded"],
    ["Expected result", action.result?.output ?? "Prepared for your review; nothing changes until you approve."],
    ["Risk", RISK_LABEL[action.classification.riskLevel]],
    [
      "Reversibility",
      action.classification.reversible ? "Reversible" : "Cannot be automatically reversed",
    ],
    ["Executor", action.source === "automation" ? "MASTERY automation" : action.source],
  ];

  return (
    <GlassCard variant="gold-accent" className={cn("space-y-3", className)}>
      <p className="text-eyebrow">Approval required</p>
      <dl className="space-y-1.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
            <dt className="text-subtle w-32 shrink-0 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase sm:pt-0.5">
              {label}
            </dt>
            <dd className={cn("text-foreground", label === "Risk" && RISK_STYLE[action.classification.riskLevel])}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {action.policyDecision ? (
        <p className="text-subtle text-xs">Policy: {action.policyDecision.reason}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onApprove}>
          Approve
        </Button>
        <Button size="sm" variant="ghost" onClick={onReject}>
          Reject
        </Button>
        {onEdit ? (
          <Button size="sm" variant="ghost" onClick={onEdit}>
            Edit
          </Button>
        ) : null}
      </div>
    </GlassCard>
  );
}
