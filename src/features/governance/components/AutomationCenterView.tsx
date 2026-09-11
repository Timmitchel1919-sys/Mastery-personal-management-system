"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, OctagonPause, Play, ShieldAlert, Sparkles } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { ApprovalCard, ACTION_CATALOG, OPS_STATUS_LABEL } from "@/features/autonomy";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { describePolicyPreview } from "../automation-policy";
import { useGovernance } from "../use-governance";

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

export function AutomationCenterView() {
  const governance = useGovernance();
  const { autonomy } = governance;
  const [phrase, setPhrase] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);

  const running = autonomy.queue.filter((a) => a.status === "EXECUTING" || a.status === "QUEUED");
  const completed = autonomy.queue.filter((a) => a.status === "COMPLETED").slice(0, 8);
  const failed = autonomy.queue.filter((a) => a.status === "FAILED");
  const paused = autonomy.queue.filter((a) => a.status === "WAITING_APPROVAL");

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Automation Center"
        description="The controlled operating loop: observe → predict → recommend → simulate → approve → execute → verify → learn → adapt. MASTERY is assistive, predictive, adaptive, and controlled — never unsupervised."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          autonomy.paused ? (
            <Button size="sm" onClick={autonomy.resumeAll}>
              <Play className="size-3.5" aria-hidden="true" />
              Resume automation
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={governance.pauseAll}>
              <OctagonPause className="size-3.5" aria-hidden="true" />
              Pause all automation
            </Button>
          )
        }
      />

      {autonomy.paused ? (
        <div role="status" className="border-warning/40 bg-warning/10 text-warning flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold">
          <OctagonPause className="size-4" aria-hidden="true" />
          Automation kill switch is active — no new autonomous action will start.
        </div>
      ) : null}

      <div className="mastery-panel flex flex-wrap gap-x-6 gap-y-2 rounded-2xl p-4 text-sm">
        {[
          ["Running", running.length],
          ["Awaiting approval", paused.length],
          ["Recently completed", completed.length],
          ["Failed", failed.length],
          ["Conflicts", governance.conflicts.length],
          ["Circuit breakers tripped", governance.circuitBreakers.length],
        ].map(([label, value]) => (
          <span key={label} className="flex items-baseline gap-1.5">
            <span className="text-subtle text-[0.6875rem] tracking-[0.08em] uppercase">{label}</span>
            <span className="text-foreground font-semibold">{value}</span>
          </span>
        ))}
      </div>

      {governance.conflicts.length > 0 ? (
        <Panel id="conflicts" title={`Conflicts (${governance.conflicts.length})`} icon={<AlertTriangle className="size-3.5" aria-hidden="true" />} description="Two in-flight actions target the same entity — paused rather than both running.">
          <ul className="text-foreground space-y-1 text-sm">
            {governance.conflicts.map((conflict) => (
              <li key={`${conflict.a}-${conflict.b}-${conflict.entity}`}>{conflict.reason}</li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {governance.circuitBreakers.length > 0 ? (
        <Panel id="breakers" title={`Circuit breakers (${governance.circuitBreakers.length})`} icon={<ShieldAlert className="size-3.5" aria-hidden="true" />} description="Paused after repeated failures rather than retrying indefinitely.">
          <ul className="text-foreground space-y-1 text-sm">
            {governance.circuitBreakers.map((breaker) => (
              <li key={breaker.actionType}>{breaker.reason}</li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {paused.length > 0 ? (
        <Panel id="approvals" title={`Pending approvals (${paused.length})`}>
          <div className="space-y-3">
            {paused.map((action) => (
              <ApprovalCard key={action.id} action={action} onApprove={() => autonomy.approve(action.id)} onReject={() => autonomy.reject(action.id)} />
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel id="queue" title="Active automations">
        {running.length === 0 && completed.length === 0 && failed.length === 0 ? (
          <p className="text-muted text-sm">Nothing running right now.</p>
        ) : (
          <ul className="divide-border divide-y">
            {[...running, ...failed, ...completed].map((action) => (
              <li key={action.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-foreground truncate">{action.title}</span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    action.status === "FAILED" ? "text-danger" : action.status === "COMPLETED" ? "text-success" : "text-primary",
                  )}
                >
                  {OPS_STATUS_LABEL[action.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        id="create-automation"
        title="Create an automation"
        icon={<Sparkles className="size-3.5" aria-hidden="true" />}
        description='Try: "Every weekday remind me to review my goals." — only recognized phrases become a policy; nothing is guessed.'
      >
        <div className="flex flex-wrap items-center gap-2">
          <Input value={phrase} onChange={(event) => setPhrase(event.target.value)} placeholder="Describe the automation…" aria-label="Automation request" className="max-w-md" />
          <Button
            size="sm"
            onClick={() => {
              governance.createDraft(phrase);
              setPhrase("");
            }}
          >
            Preview policy
          </Button>
        </div>

        {governance.drafts.length === 0 ? (
          <p className="text-muted text-sm">No drafts yet.</p>
        ) : (
          <ul className="space-y-3">
            {governance.drafts.map((draft) => (
              <li key={draft.id} className="border-border rounded-xl border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-foreground text-sm font-semibold">
                    {draft.name} <span className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">v{draft.version}</span>
                  </p>
                  <span className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">
                    {ACTION_CATALOG[draft.actionType].label}
                  </span>
                </div>
                <p className="text-muted mt-1 text-sm">{describePolicyPreview(draft)}</p>
                <ul className="text-subtle mt-1 list-disc space-y-0.5 pl-4 text-xs">
                  {draft.conditions.map((condition, index) => (
                    <li key={index}>{condition}</li>
                  ))}
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => governance.activateDraft(draft.id)}>
                    Activate
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setTestResult(governance.testDraft(draft, true).explanation)}>
                    Test policy
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {testResult ? <p className="text-primary text-xs">{testResult}</p> : null}
      </Panel>

      <Panel id="audit" title={`Audit log (${governance.audit.length})`} description={governance.auditIntegrity.intact ? "Chain intact." : "Integrity check failed — a record may have been altered."}>
        {governance.audit.length === 0 ? (
          <p className="text-muted text-sm">No governance events recorded yet.</p>
        ) : (
          <ul className="text-muted space-y-1 text-xs">
            {[...governance.audit].reverse().slice(0, 15).map((event) => (
              <li key={event.id}>
                <span className="text-subtle tracking-[0.05em] uppercase">{event.type}</span> — {event.summary}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <p className="text-subtle text-xs">
        Governance extends the Trust Center&rsquo;s policy engine — manage autonomy level and
        per-action permissions in{" "}
        <Link href="/operations" className="text-primary hover:underline">
          Trust Center
        </Link>
        .
      </p>
    </PageContainer>
  );
}
