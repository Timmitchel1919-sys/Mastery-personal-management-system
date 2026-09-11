"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CalendarDays,
  CircleDot,
  Compass,
  GitBranch,
  Scale,
  Sparkles,
  Target,
} from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState } from "@/components/shared";
import { Button, GlassCard, Progress, Skeleton } from "@/components/ui";
import { AdaptationSignalsPanel } from "@/features/adaptation";
import { PendingApprovalsPanel } from "@/features/autonomy";
import { BrainHub } from "@/features/brain-hub";
import { RelevantContextPanel } from "@/features/context";
import { ForesightSignalsPanel } from "@/features/foresight";
import { StrategySignalsPanel } from "@/features/strategy";
import { cn } from "@/lib/utils";
import {
  COMMAND_SEVERITY_LABEL,
  isEmptyCommandCenter,
  type AttentionItem,
  type CommandSeverity,
  type CommandCenterState,
} from "../command-center-state";
import { useCommandCenter } from "../use-command-center";

const SEVERITY_STYLE: Record<CommandSeverity, string> = {
  CRITICAL: "border-danger/40 text-danger",
  WARNING: "border-warning/40 text-warning",
  NOTICE: "border-primary/30 text-primary",
  INFO: "border-border text-muted",
};

function SeverityTag({ severity }: { severity: CommandSeverity }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[0.625rem] font-semibold tracking-[0.08em] uppercase",
        SEVERITY_STYLE[severity],
      )}
    >
      {COMMAND_SEVERITY_LABEL[severity]}
    </span>
  );
}

function Panel({
  id,
  title,
  icon,
  description,
  children,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
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

function ActionLink({ action }: { action: { label: string; href: string } | null }) {
  if (!action) return null;
  return (
    <Button asChild size="sm" variant="ghost" className="shrink-0">
      <Link href={action.href}>
        {action.label}
        <ArrowRight aria-hidden="true" className="size-3.5" />
      </Link>
    </Button>
  );
}

function NowPanel({ now }: { now: CommandCenterState["now"] }) {
  const rows: Array<[string, string | null]> = [
    ["Current focus", now.focus],
    ["Active task", now.activeTask],
    ["Active goal", now.activeGoal],
    ["Top priority", now.priority],
    ["Deadline in view", now.deadline],
    ["Alert", now.alert],
  ];
  const anything = rows.some(([, value]) => value) || now.nextAction;

  return (
    <Panel id="now" title="Now" icon={<CircleDot className="size-3.5" aria-hidden="true" />}>
      {!anything ? (
        <p className="text-muted text-sm">No active focus session. Nothing is demanding your attention right now.</p>
      ) : (
        <dl className="space-y-2 text-sm">
          {rows
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                <dt className="text-subtle w-36 shrink-0 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase sm:pt-0.5">
                  {label}
                </dt>
                <dd className="text-foreground">{value}</dd>
              </div>
            ))}
        </dl>
      )}
      {now.nextAction ? (
        <div className="border-border flex items-center justify-between gap-3 border-t pt-3">
          <p className="text-subtle text-xs">Recommended next step</p>
          <ActionLink action={now.nextAction} />
        </div>
      ) : null}
    </Panel>
  );
}

function AttentionRow({ item }: { item: AttentionItem }) {
  return (
    <li className="border-border flex items-start justify-between gap-3 border-b py-3 last:border-b-0">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityTag severity={item.severity} />
          <span className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">
            {item.sourceModule}
          </span>
        </div>
        <p className="text-foreground text-sm font-medium">{item.title}</p>
        <p className="text-muted text-xs">{item.reason}</p>
      </div>
      <ActionLink action={item.action} />
    </li>
  );
}

function ThemeIcon({ children }: { children: React.ReactNode }) {
  return <span className="text-primary">{children}</span>;
}

export function CommandCenterView() {
  const { status, state, brainState, reload } = useCommandCenter();

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Command Center"
        description="See what matters. Understand why. Decide what to do. Act."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button size="sm" variant="ghost" onClick={reload}>
            Refresh
          </Button>
        }
      />

      {state.degraded.length > 0 ? (
        <div
          role="status"
          className="border-warning/30 bg-warning/5 text-muted flex flex-col gap-1 rounded-xl border px-4 py-3 text-xs"
        >
          <span className="text-warning flex items-center gap-1.5 font-medium">
            <AlertTriangle className="size-3.5" aria-hidden="true" />
            Running on partial signals
          </span>
          {state.degraded.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      ) : null}

      {status === "loading" ? (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : state.mode === "no-data" && isEmptyCommandCenter(state) ? (
        <EmptyState
          icon={<Brain aria-hidden="true" />}
          title="Your cockpit is still warming up"
          description="The Command Center reflects real activity across GOALS, PLAN, FOCUS, ACT, GROW and ANALYTICS. Add a goal, plan your week, or start a focus block and this view fills in."
          action={
            <Button asChild size="sm">
              <Link href="/hub">Open the Brain Hub</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* LEVEL: AI Executive Brief */}
          <GlassCard variant="gold-accent" className="space-y-3">
            <p className="text-eyebrow flex items-center gap-1.5">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Executive brief
              <span className="text-subtle ml-1 font-normal normal-case">
                · grounded in current MASTERY data
              </span>
            </p>
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ["Today's state", state.brief.state],
                ["Key development", state.brief.keyDevelopment],
                ["Watch", state.brief.risk],
                ["Needs your judgment", state.brief.decision],
                ["Consider", state.brief.recommendation],
                ["Recently learned", state.brief.learning],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-subtle text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
                      {label}
                    </dt>
                    <dd className="text-foreground text-sm">{value}</dd>
                  </div>
                ))}
            </dl>
          </GlassCard>

          {/* LEVEL 1 (Now) + Brain orientation */}
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-start">
            <NowPanel now={state.now} />
            <section
              aria-labelledby="cc-brain-heading"
              className="mastery-panel space-y-3 rounded-2xl p-5"
            >
              <h2 id="cc-brain-heading" className="text-eyebrow flex items-center gap-1.5">
                <Brain className="size-3.5" aria-hidden="true" />
                System orientation
              </h2>
              <p className="text-subtle text-xs">
                The brain is your Personal Operating System. Activity:{" "}
                <span className="text-foreground font-semibold capitalize">
                  {brainState.overallActivity}
                </span>
                .
              </p>
              <BrainHub systemState={brainState} className=" " />
            </section>
          </div>

          {/* LEVEL 2 (Attention) */}
          <Panel
            id="attention"
            title="Attention queue"
            icon={<AlertTriangle className="size-3.5" aria-hidden="true" />}
            description="Prioritised by severity. Every item names its source and a way to act."
          >
            {state.attention.length === 0 ? (
              <p className="text-muted text-sm">Nothing needs your attention right now.</p>
            ) : (
              <ul>
                {state.attention.map((item) => (
                  <AttentionRow key={item.id} item={item} />
                ))}
              </ul>
            )}
          </Panel>

          {/* LEVEL: Today */}
          <Panel
            id="today"
            title="Today"
            icon={<CalendarDays className="size-3.5" aria-hidden="true" />}
            description="What matters today. Each item opens the module that owns it."
          >
            {state.today.length === 0 ? (
              <p className="text-muted text-sm">Nothing scheduled or flagged for today.</p>
            ) : (
              <ul className="divide-border divide-y">
                {state.today.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="hover:bg-surface/40 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                    >
                      <span className="text-foreground min-w-0 truncate">{item.label}</span>
                      <span className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">
                        {item.kind}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* LEVEL 4 (Decisions) */}
          <Panel
            id="decisions"
            title="Decision queue"
            icon={<Scale className="size-3.5" aria-hidden="true" />}
            description="Decisions waiting on your judgment. MASTERY never resolves these for you."
          >
            {state.decisions.length === 0 ? (
              <p className="text-muted text-sm">No decisions are waiting on you.</p>
            ) : (
              <ul className="space-y-3">
                {state.decisions.map((decision) => (
                  <li
                    key={decision.id}
                    className="border-border flex items-start justify-between gap-3 rounded-xl border p-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {decision.overdue ? <SeverityTag severity="WARNING" /> : null}
                        <span className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">
                          {decision.status.toLowerCase()}
                          {decision.dueDate ? ` · due ${decision.dueDate}` : ""}
                        </span>
                      </div>
                      <p className="text-foreground text-sm font-medium">{decision.title}</p>
                      <p className="text-muted line-clamp-2 text-xs">{decision.context}</p>
                      <p className="text-subtle text-[0.6875rem]">
                        {decision.affectedGoals} goal(s) · {decision.affectedPlans} plan(s) ·{" "}
                        {decision.relatedPredictions} prediction(s)
                      </p>
                    </div>
                    <ActionLink action={decision.action} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* LEVEL 3 (Risk) */}
          <Panel
            id="risk"
            title="Risk center"
            icon={<AlertTriangle className="size-3.5" aria-hidden="true" />}
            description="Aggregated from existing predictions and deterministic warnings — no new engine."
          >
            {state.risk.length === 0 ? (
              <p className="text-muted text-sm">No elevated risks detected.</p>
            ) : (
              <ul className="space-y-3">
                {state.risk.map((risk) => (
                  <li key={risk.id} className="border-border rounded-xl border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-foreground text-xs font-semibold tracking-[0.08em] uppercase">
                        {risk.category}
                      </span>
                      <span className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">
                        {risk.confidence} confidence · {risk.area}
                      </span>
                    </div>
                    <p className="text-foreground mt-1 text-sm">{risk.explanation}</p>
                    {risk.evidence.length > 0 ? (
                      <ul className="text-muted mt-1 list-disc space-y-0.5 pl-5 text-xs">
                        {risk.evidence.slice(0, 3).map((line, index) => (
                          <li key={index}>{line}</li>
                        ))}
                      </ul>
                    ) : null}
                    {risk.action ? (
                      <div className="mt-2">
                        <ActionLink action={risk.action} />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* LEVEL 7 (Strategy) — high-relevance strategic signal only */}
          <StrategySignalsPanel />

          {/* Predictions — top early warning + active forecast count */}
          <ForesightSignalsPanel />

          {/* Continuous adaptation — top signal + proposals awaiting review */}
          <AdaptationSignalsPanel />

          {/* Autonomous operations — pending approvals / running / failed */}
          <PendingApprovalsPanel />

          {/* Knowledge — a compact, scoped "what history is relevant" strip */}
          <RelevantContextPanel scope={{ module: "dashboard" }} limit={3} compact />


          {/* LEVEL 5 (Progress) — progressive disclosure */}
          <details className="mastery-panel rounded-2xl p-5 [&_summary]:cursor-pointer">
            <summary className="text-eyebrow flex items-center gap-1.5 list-none">
              <ThemeIcon>
                <Target className="size-3.5" aria-hidden="true" />
              </ThemeIcon>
              Progress center
              <span className="text-subtle ml-1 font-normal normal-case">
                ({state.progress.length} metric{state.progress.length === 1 ? "" : "s"})
              </span>
            </summary>
            <div className="mt-4 space-y-3">
              {state.progress.length === 0 ? (
                <p className="text-muted text-sm">
                  No reliable progress metric yet. MASTERY will not invent one.
                </p>
              ) : (
                state.progress.map((metric) => (
                  <div key={metric.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <Link href={metric.href} className="text-foreground hover:underline">
                        {metric.label}
                      </Link>
                      <span className="text-muted tabular-nums">
                        {metric.value === null ? "—" : `${Math.round(metric.value)}%`}
                      </span>
                    </div>
                    <Progress value={metric.value ?? 0} />
                    <p className="text-subtle text-[0.6875rem]">{metric.detail}</p>
                  </div>
                ))
              )}
            </div>
          </details>

          {/* LEVEL 7 (Strategy) — progressive disclosure */}
          <details className="mastery-panel rounded-2xl p-5 [&_summary]:cursor-pointer">
            <summary className="text-eyebrow flex items-center gap-1.5 list-none">
              <ThemeIcon>
                <GitBranch className="size-3.5" aria-hidden="true" />
              </ThemeIcon>
              Strategic alignment
              <span className="text-subtle ml-1 font-normal normal-case">
                — how current activity connects to long-term objectives
              </span>
            </summary>
            <div className="mt-4 space-y-3">
              {state.alignment.length === 0 ? (
                <p className="text-muted text-sm">
                  No linked strategy → action chains are available yet. Connect goals to plans to
                  see them here.
                </p>
              ) : (
                state.alignment.map((chain) => (
                  <ol
                    key={chain.id}
                    className="text-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
                  >
                    {chain.steps.map((step, index) => (
                      <li key={`${chain.id}-${index}`} className="flex items-center gap-2">
                        {index > 0 ? <span aria-hidden="true">→</span> : null}
                        <span>
                          <span className="text-subtle">{step.label}: </span>
                          {step.href ? (
                            <Link href={step.href} className="text-foreground hover:underline">
                              {step.value}
                            </Link>
                          ) : (
                            <span className="text-foreground">{step.value}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>
                ))
              )}
            </div>
          </details>

          {/* Quick actions */}
          <Panel
            id="quick-actions"
            title="Quick actions"
            icon={<Compass className="size-3.5" aria-hidden="true" />}
            description="Jump straight to the module that owns the workflow — creation happens there."
          >
            <div className="flex flex-wrap gap-2">
              {[
                { label: "New goal", href: "/plan/goals" },
                { label: "Plan the week", href: "/plan/weekly" },
                { label: "New task", href: "/act/tasks" },
                { label: "Start focus", href: "/focus" },
                { label: "Record decision", href: "/decisions" },
                { label: "Add reflection", href: "/grow/journal" },
                { label: "Open analytics", href: "/analytics" },
              ].map((action) => (
                <Button key={action.href} asChild size="sm" variant="secondary">
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ))}
            </div>
          </Panel>
        </>
      )}
    </PageContainer>
  );
}
