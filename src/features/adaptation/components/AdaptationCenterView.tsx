"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Brain, Compass, Layers, ShieldCheck, Sparkles } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState } from "@/components/shared";
import { Button, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  PROPOSAL_STATUS_LABEL,
  SEVERITY_RANK,
  SIGNAL_TYPE_LABEL,
  type AdaptationProposal,
  type Signal,
  type SignalSeverity,
} from "../adaptation-model";
import { useAdaptation } from "../use-adaptation";

const DISMISSED_KEY = "mastery.adaptation.dismissed";

function readDismissed(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

const SEVERITY_STYLE: Record<SignalSeverity, string> = {
  CRITICAL: "border-danger/40 text-danger",
  HIGH: "border-warning/40 text-warning",
  MEDIUM: "border-primary/30 text-primary",
  LOW: "border-border text-muted",
  INFO: "border-border text-subtle",
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

function SignalRow({ signal }: { signal: Signal }) {
  return (
    <li className="border-border flex items-start justify-between gap-3 border-b py-2.5 last:border-b-0">
      <div className="min-w-0 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full border px-2 py-0.5 text-[0.625rem] font-semibold tracking-[0.08em] uppercase", SEVERITY_STYLE[signal.severity])}>
            {signal.severity}
          </span>
          <span className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">
            {SIGNAL_TYPE_LABEL[signal.type]} · {signal.sourceModule}
          </span>
        </div>
        <p className="text-foreground text-sm">{signal.statement}</p>
      </div>
    </li>
  );
}

function ProposalCard({
  proposal,
  onApprove,
  onDismiss,
}: {
  proposal: AdaptationProposal;
  onApprove: () => void;
  onDismiss: () => void;
}) {
  return (
    <li className="border-border rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-foreground text-sm font-semibold">{proposal.title}</p>
        <span className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">
          {proposal.confidence} confidence · {PROPOSAL_STATUS_LABEL[proposal.status]}
        </span>
      </div>
      <dl className="mt-2 space-y-1.5 text-sm">
        <div>
          <dt className="text-subtle text-[0.625rem] font-semibold tracking-[0.08em] uppercase">What changed</dt>
          <dd className="text-foreground">{proposal.currentState}</dd>
        </div>
        <div>
          <dt className="text-subtle text-[0.625rem] font-semibold tracking-[0.08em] uppercase">Proposed change</dt>
          <dd className="text-muted">{proposal.proposedChange}</dd>
        </div>
        {proposal.evidence.length > 0 ? (
          <div>
            <dt className="text-subtle text-[0.625rem] font-semibold tracking-[0.08em] uppercase">Evidence</dt>
            <dd>
              <ul className="text-muted list-disc space-y-0.5 pl-4 text-xs">
                {proposal.evidence.slice(0, 3).map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}
        <div className="grid gap-1.5 sm:grid-cols-2">
          <div>
            <dt className="text-subtle text-[0.625rem] font-semibold tracking-[0.08em] uppercase">Expected impact</dt>
            <dd className="text-muted">{proposal.expectedImpact}</dd>
          </div>
          <div>
            <dt className="text-subtle text-[0.625rem] font-semibold tracking-[0.08em] uppercase">Risks</dt>
            <dd className="text-muted">{proposal.risks[0]}</dd>
          </div>
        </div>
        <div>
          <dt className="text-subtle text-[0.625rem] font-semibold tracking-[0.08em] uppercase">Alternatives</dt>
          <dd className="text-muted text-xs">{proposal.alternatives.join(" · ")}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={onApprove}>
          Approve → Trust Center
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href="/simulation">Simulate first</Link>
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </li>
  );
}

export function AdaptationCenterView() {
  const { status, signals, activeProposals, conflicts, focusHealth, systemHealth, notifications, dailyBrief, autonomy, reload } =
    useAdaptation();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setDismissed(readDismissed());
      setHydrated(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const dismiss = (id: string) => {
    setDismissed((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      try {
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
      } catch {
        // per-viewer convenience only
      }
      return next;
    });
  };

  const visibleProposals = activeProposals.filter((proposal) => !dismissed.includes(proposal.id));
  const topSignals = [...signals].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]).slice(0, 8);

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Adaptation"
        description="Observe → interpret → evaluate → recommend. Nothing here changes your goals, values, or plans without your review."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button size="sm" variant="ghost" onClick={reload}>
            Refresh
          </Button>
        }
      />

      {!systemHealth.healthy || systemHealth.automationsPaused ? (
        <div role="status" className="border-warning/30 bg-warning/5 text-muted flex flex-wrap items-center gap-2 rounded-xl border px-4 py-2 text-xs">
          <AlertTriangle className="text-warning size-3.5 shrink-0" aria-hidden="true" />
          {systemHealth.degradedAreas.length > 0 ? (
            <span>System state degraded: {systemHealth.degradedAreas.join(", ")}. Deterministic signals still shown.</span>
          ) : null}
          {systemHealth.automationsPaused ? <span>Automations are paused in the Trust Center.</span> : null}
        </div>
      ) : null}

      {status === "loading" && !hydrated ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="mastery-panel flex flex-wrap gap-x-6 gap-y-2 rounded-2xl p-4 text-sm">
            {[
              ["Signals", signals.length],
              ["Proposals awaiting review", visibleProposals.length],
              ["Conflicts", conflicts.length],
              ["Focus", focusHealth.state.replace("-", " ")],
              ["Notifications", notifications.length],
            ].map(([label, value]) => (
              <span key={label} className="flex items-baseline gap-1.5">
                <span className="text-subtle text-[0.6875rem] tracking-[0.08em] uppercase">{label}</span>
                <span className="text-foreground font-semibold capitalize">{value}</span>
              </span>
            ))}
          </div>

          <Panel id="brief" title="Today's brief" icon={<Sparkles className="size-3.5" aria-hidden="true" />}>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["Priorities", dailyBrief.priorities],
                  ["Deadlines", dailyBrief.deadlines],
                  ["Conflicts", dailyBrief.conflicts],
                  ["Risks", dailyBrief.risks],
                ] as const
              )
                .filter(([, items]) => items.length > 0)
                .map(([label, items]) => (
                  <div key={label}>
                    <p className="text-subtle text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">{label}</p>
                    <ul className="text-foreground mt-1 space-y-0.5 text-sm">
                      {items.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              {dailyBrief.priorities.length === 0 && dailyBrief.deadlines.length === 0 && dailyBrief.risks.length === 0 ? (
                <p className="text-muted text-sm">Nothing urgent today.</p>
              ) : null}
            </div>
            <p className="text-subtle text-xs">
              Weekly and monthly reviews live in{" "}
              <Link href="/strategy" className="text-primary hover:underline">
                Strategy
              </Link>
              ; adaptation proposals add to that review.
            </p>
          </Panel>

          {conflicts.length > 0 ? (
            <Panel id="conflicts" title={`Conflicting adaptations (${conflicts.length})`} icon={<AlertTriangle className="size-3.5" aria-hidden="true" />} description="Two proposals pull in opposite directions — compare and choose, nothing auto-applies.">
              <ul className="text-foreground space-y-1 text-sm">
                {conflicts.map((conflict) => (
                  <li key={`${conflict.a}-${conflict.b}`}>{conflict.reason}</li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel
            id="proposals"
            title={`Adaptation proposals (${visibleProposals.length})`}
            icon={<Compass className="size-3.5" aria-hidden="true" />}
            description="Evidence-backed, always reviewable. Approving sends a prepared draft to the Trust Center — nothing executes automatically."
          >
            {visibleProposals.length === 0 ? (
              <EmptyState icon={<ShieldCheck aria-hidden="true" />} title="No adaptation proposed right now" description="Operations look steady against your current data." />
            ) : (
              <ul className="space-y-3">
                {visibleProposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    onApprove={() =>
                      autonomy.enqueue({
                        actionType: "PREPARE_PLAN_DRAFT",
                        source: "user",
                        title: proposal.title,
                        reason: proposal.currentState,
                        affectedEntities: proposal.evidence,
                      })
                    }
                    onDismiss={() => dismiss(proposal.id)}
                  />
                ))}
              </ul>
            )}
          </Panel>

          <Panel id="signals" title={`Signals (${signals.length})`} icon={<Layers className="size-3.5" aria-hidden="true" />} description="Every signal traces to real data — nothing fabricated.">
            {topSignals.length === 0 ? (
              <p className="text-muted text-sm">No signals detected.</p>
            ) : (
              <ul>
                {topSignals.map((signal) => (
                  <SignalRow key={signal.id} signal={signal} />
                ))}
              </ul>
            )}
          </Panel>

          <Panel id="brain-state" title="System overview" icon={<Brain className="size-3.5" aria-hidden="true" />}>
            <p className="text-muted text-sm">
              Focus: <span className="text-foreground font-medium capitalize">{focusHealth.state.replace("-", " ")}</span> ·{" "}
              {focusHealth.reasons[0]}
            </p>
            <p className="text-subtle text-xs">
              System: {systemHealth.healthy ? "nominal" : `degraded (${systemHealth.degradedAreas.join(", ")})`} · AI{" "}
              {systemHealth.aiAvailable ? "available" : "unavailable — deterministic signals continue"} · automations{" "}
              {systemHealth.automationsPaused ? "paused" : "active"}.
            </p>
          </Panel>
        </>
      )}
    </PageContainer>
  );
}
