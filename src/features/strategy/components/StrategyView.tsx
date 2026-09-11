"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Compass,
  GitBranch,
  Layers,
  Lightbulb,
  Route,
  Scale,
  Timer,
} from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState } from "@/components/shared";
import { Button, SegmentedControl, SegmentedControlItem, Skeleton } from "@/components/ui";
import { RelevantContextPanel } from "@/features/context";
import { cn } from "@/lib/utils";
import {
  STRATEGY_CONFIDENCE_LABEL,
  isEmptyStrategy,
  type GoalAlignmentLevel,
  type GoalHealthState,
  type ReviewKind,
  type StrategicReview,
  type WhatIfInput,
} from "../strategy-engine";
import { useStrategy } from "../use-strategy";

const ALIGNMENT_STYLE: Record<GoalAlignmentLevel, string> = {
  aligned: "text-success",
  weak: "text-warning",
  unclear: "text-muted",
};

const HEALTH_STYLE: Record<GoalHealthState, string> = {
  "on-track": "text-success",
  "at-risk": "text-warning",
  stalled: "text-danger",
  inactive: "text-muted",
  "insufficient-data": "text-subtle",
};

const HEALTH_LABEL: Record<GoalHealthState, string> = {
  "on-track": "On track",
  "at-risk": "At risk",
  stalled: "Stalled",
  inactive: "Inactive",
  "insufficient-data": "Insufficient data",
};

function Panel({
  id,
  title,
  icon,
  description,
  children,
  collapsible,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
}) {
  const heading = (
    <div className="space-y-1">
      <h2 id={`${id}-heading`} className="text-eyebrow flex items-center gap-1.5">
        {icon}
        {title}
      </h2>
      {description ? <p className="text-subtle text-xs">{description}</p> : null}
    </div>
  );

  if (collapsible) {
    return (
      <details className="mastery-panel rounded-2xl p-5 [&_summary]:cursor-pointer">
        <summary className="list-none">{heading}</summary>
        <div className="mt-4">{children}</div>
      </details>
    );
  }

  return (
    <section aria-labelledby={`${id}-heading`} className="mastery-panel space-y-4 rounded-2xl p-5">
      {heading}
      {children}
    </section>
  );
}

function EvidenceList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="text-muted mt-1 list-disc space-y-0.5 pl-5 text-xs">
      {items.slice(0, 4).map((line, index) => (
        <li key={index}>{line}</li>
      ))}
    </ul>
  );
}

const WHAT_IF_OPTIONS: Array<{ value: WhatIfInput["kind"]; label: string }> = [
  { value: "defer-project", label: "Postpone a project" },
  { value: "increase-focus", label: "Increase focus on a goal" },
  { value: "add-project", label: "Add another project" },
  { value: "reduce-commitment", label: "Reduce a commitment" },
];

function ReviewBlock({ kind, review }: { kind: ReviewKind; review: StrategicReview }) {
  const groups: Array<[string, string[]]> = [
    ["What moved forward", review.movedForward],
    ["What did not", review.didNotMove],
    ["Why it may matter", review.whyItMayMatter],
    ["What is at risk", review.atRisk],
    ["What changed", review.changed],
    ["What to review", review.toReview],
  ];
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {groups
          .filter(([, items]) => items.length > 0)
          .map(([label, items]) => (
            <div key={label}>
              <p className="text-subtle text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
                {label}
              </p>
              <ul className="text-foreground mt-1 space-y-0.5 text-sm">
                {items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
      </div>

      {kind === "monthly" && review.categories ? (
        <div className="border-border grid gap-3 border-t pt-3 sm:grid-cols-4">
          {(["keep", "change", "stop", "start"] as const).map((bucket) => (
            <div key={bucket}>
              <p className="text-subtle text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
                {bucket}
              </p>
              <ul className="text-muted mt-1 space-y-0.5 text-xs">
                {(review.categories?.[bucket] ?? []).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
                {(review.categories?.[bucket] ?? []).length === 0 ? <li>—</li> : null}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {kind === "quarterly" && review.questions ? (
        <div className="border-border border-t pt-3">
          <p className="text-subtle text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
            Strategic questions
          </p>
          <ul className="text-foreground mt-1 list-disc space-y-0.5 pl-5 text-sm">
            {review.questions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ul>
          <p className="text-subtle mt-2 text-xs">These are for you to answer — MASTERY does not.</p>
        </div>
      ) : null}
    </div>
  );
}

export function StrategyView() {
  const { status, state, review, whatIf: runWhatIf, reload } = useStrategy();
  const [reviewKind, setReviewKind] = useState<ReviewKind>("weekly");
  const [whatIfKind, setWhatIfKind] = useState<WhatIfInput["kind"]>("increase-focus");

  const currentReview = useMemo(() => review(reviewKind), [review, reviewKind]);

  const whatIf = useMemo(() => {
    const topGoal = state.alignment[0]?.goalId;
    return runWhatIf(topGoal ? { kind: whatIfKind, targetGoalId: topGoal } : { kind: whatIfKind });
  }, [runWhatIf, state.alignment, whatIfKind]);

  const contextChips: Array<[string, string | number]> = [
    ["Active goals", state.context.activeGoals],
    ["Strategic objectives", state.context.strategicObjectives],
    ["Active plans", state.context.activePlans],
    ["Avg goal progress", state.context.progressState === null ? "—" : `${state.context.progressState}%`],
    ["Open decisions", state.context.decisionState],
    ["Execution", state.context.executionState],
  ];

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Strategy"
        description="Where am I? Where am I headed? What is changing? What are my options? You decide."
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
            Advisory only · running on partial signals
          </span>
          {state.degraded.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      ) : null}

      {status === "loading" ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : isEmptyStrategy(state) ? (
        <EmptyState
          icon={<Compass aria-hidden="true" />}
          title="Strategy needs something to reason about"
          description="Add a goal and a plan, and this view will show alignment, drift, goal health, bottlenecks, options and trade-offs — all advisory, all explained."
          action={
            <Button asChild size="sm">
              <Link href="/plan/goals">Open Goals</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="mastery-panel flex flex-wrap gap-x-6 gap-y-2 rounded-2xl p-4 text-sm">
            {contextChips.map(([label, value]) => (
              <span key={label} className="flex items-baseline gap-1.5">
                <span className="text-subtle text-[0.6875rem] tracking-[0.08em] uppercase">{label}</span>
                <span className="text-foreground font-semibold capitalize">{value}</span>
              </span>
            ))}
          </div>

          {/* Recommendations */}
          <Panel
            id="recommendations"
            title="Strategic recommendations"
            icon={<Lightbulb className="size-3.5" aria-hidden="true" />}
            description="Each is advisory. Nothing is applied automatically — you REVIEW, then decide."
          >
            {state.recommendations.length === 0 ? (
              <p className="text-muted text-sm">
                No strategic adjustment is indicated right now. Current activity looks reasonably
                aligned.
              </p>
            ) : (
              <ul className="space-y-4">
                {state.recommendations.map((rec) => (
                  <li key={rec.id} className="border-border rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-foreground text-sm font-semibold">{rec.title}</p>
                      <span className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">
                        {STRATEGY_CONFIDENCE_LABEL[rec.confidence]} · {rec.userAction}
                      </span>
                    </div>
                    <dl className="mt-2 space-y-1.5 text-sm">
                      <div>
                        <dt className="text-subtle text-[0.625rem] font-semibold tracking-[0.08em] uppercase">
                          Observation
                        </dt>
                        <dd className="text-foreground">{rec.observation}</dd>
                      </div>
                      <EvidenceList items={rec.evidence} />
                      <div>
                        <dt className="text-subtle text-[0.625rem] font-semibold tracking-[0.08em] uppercase">
                          Option
                        </dt>
                        <dd className="text-muted">{rec.option}</dd>
                      </div>
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        <div>
                          <dt className="text-subtle text-[0.625rem] font-semibold tracking-[0.08em] uppercase">
                            Expected benefit
                          </dt>
                          <dd className="text-muted">{rec.expectedBenefit}</dd>
                        </div>
                        <div>
                          <dt className="text-subtle text-[0.625rem] font-semibold tracking-[0.08em] uppercase">
                            Potential downside
                          </dt>
                          <dd className="text-muted">{rec.potentialDownside}</dd>
                        </div>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Alignment + drift */}
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <Panel
              id="alignment"
              title="Strategic alignment"
              icon={<GitBranch className="size-3.5" aria-hidden="true" />}
              description="Current activity vs long-term objective. Evidence shown, no judgment."
            >
              {state.alignment.length === 0 ? (
                <p className="text-muted text-sm">No active goals to assess.</p>
              ) : (
                <ul className="space-y-2">
                  {state.alignment.map((row) => (
                    <li key={row.goalId} className="border-border border-b pb-2 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-foreground min-w-0 truncate">{row.goalTitle}</span>
                        <span className={cn("shrink-0 text-xs font-medium capitalize", ALIGNMENT_STYLE[row.level])}>
                          {row.level}
                        </span>
                      </div>
                      <EvidenceList items={row.evidence} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              id="drift"
              title="Strategic drift"
              icon={<Route className="size-3.5" aria-hidden="true" />}
              description="Where execution has diverged from plan. Neutral language — cause is not assumed."
            >
              {state.drift.length === 0 ? (
                <p className="text-muted text-sm">No drift indicators in the current window.</p>
              ) : (
                <ul className="space-y-3">
                  {state.drift.map((signal) => (
                    <li key={signal.id}>
                      <p className="text-foreground text-sm">{signal.statement}</p>
                      <EvidenceList items={signal.evidence} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          {/* Goal health */}
          <Panel
            id="goal-health"
            title="Goal health"
            icon={<AlertTriangle className="size-3.5" aria-hidden="true" />}
            description="Derived from progress, deadlines, execution and blockers — not an AI score."
          >
            {state.goalHealth.length === 0 ? (
              <p className="text-muted text-sm">No goals to assess.</p>
            ) : (
              <ul className="divide-border divide-y">
                {state.goalHealth.map((row) => (
                  <li key={row.goalId} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-foreground truncate text-sm">{row.goalTitle}</p>
                      <p className="text-muted text-xs">{row.reasons[0]}</p>
                    </div>
                    <span className={cn("shrink-0 text-xs font-medium", HEALTH_STYLE[row.state])}>
                      {HEALTH_LABEL[row.state]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Bottlenecks + opportunities */}
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <Panel
              id="bottlenecks"
              title="Bottlenecks"
              icon={<Timer className="size-3.5" aria-hidden="true" />}
              description="Constraints holding progress back. The engine surfaces them; it does not invent a fix."
            >
              {state.bottlenecks.length === 0 ? (
                <p className="text-muted text-sm">No clear bottleneck detected.</p>
              ) : (
                <ul className="space-y-3">
                  {state.bottlenecks.map((item) => (
                    <li key={item.id}>
                      <p className="text-foreground text-sm">
                        <span className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">
                          {item.type}
                        </span>{" "}
                        {item.statement}
                      </p>
                      <EvidenceList items={item.evidence} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              id="opportunities"
              title="Opportunities"
              icon={<Lightbulb className="size-3.5" aria-hidden="true" />}
              description="Surfaced only where evidence supports them."
            >
              {state.opportunities.length === 0 ? (
                <p className="text-muted text-sm">No opportunities identified from current data.</p>
              ) : (
                <ul className="space-y-3">
                  {state.opportunities.map((opp) => (
                    <li key={opp.id}>
                      <p className="text-foreground text-sm">{opp.observation}</p>
                      <p className="text-muted text-xs">Potential benefit: {opp.potentialBenefit}</p>
                      <EvidenceList items={opp.evidence} />
                      <p className="text-subtle mt-1 text-[0.6875rem]">
                        Assumes: {opp.assumptions.join("; ")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          {/* Trade-offs */}
          {state.tradeOffs.length > 0 ? (
            <Panel
              id="tradeoffs"
              title="Trade-offs"
              icon={<Scale className="size-3.5" aria-hidden="true" />}
              description="When priorities compete. MASTERY does not choose for you."
            >
              <ul className="space-y-3">
                {state.tradeOffs.map((item) => (
                  <li key={item.id} className="border-border rounded-xl border p-3 text-sm">
                    <p className="text-foreground">
                      <span className="font-medium">A.</span> {item.optionA}
                    </p>
                    <p className="text-foreground">
                      <span className="font-medium">B.</span> {item.optionB}
                    </p>
                    <p className="text-muted mt-1 text-xs">Trade-off: {item.tradeOff}</p>
                    <p className="text-muted text-xs">Possible consequence: {item.potentialConsequence}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {/* Scenarios */}
          <Panel
            id="scenarios"
            title="Scenarios"
            icon={<Layers className="size-3.5" aria-hidden="true" />}
            description="Directional implications of each course. Predictive elements are labelled."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {state.scenarios.map((scenario) => (
                <div key={scenario.kind} className="border-border rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-foreground text-sm font-semibold">{scenario.title}</p>
                    <span className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">
                      {scenario.horizon.replace("-", " ")}
                    </span>
                  </div>
                  <p className="text-muted mt-0.5 text-xs">{scenario.description}</p>
                  <EvidenceList items={scenario.implications} />
                </div>
              ))}
            </div>
          </Panel>

          {/* What-if */}
          <Panel
            id="what-if"
            title="What-if"
            icon={<Route className="size-3.5" aria-hidden="true" />}
            description="Controlled analysis. Facts, estimates and assumptions are kept separate."
          >
            <div className="flex flex-wrap gap-2">
              {WHAT_IF_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={whatIfKind === option.value ? "secondary" : "ghost"}
                  onClick={() => setWhatIfKind(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <p className="text-foreground mt-3 text-sm font-medium">{whatIf.question}</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["Fact", whatIf.facts],
                  ["Estimate", whatIf.estimates],
                  ["Assumption", whatIf.assumptions],
                ] as const
              ).map(([label, items]) => (
                <div key={label}>
                  <p className="text-subtle text-[0.625rem] font-semibold tracking-[0.08em] uppercase">
                    {label}
                  </p>
                  <ul className="text-muted mt-1 list-disc space-y-0.5 pl-4 text-xs">
                    {items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Panel>

          {/* Strategic review */}
          <Panel
            id="review"
            title="Strategic review"
            icon={<Compass className="size-3.5" aria-hidden="true" />}
            description="A concise summary at your chosen cadence. Recommendations, not automatic changes."
          >
            <SegmentedControl
              value={reviewKind}
              onValueChange={(value) => {
                if (value) setReviewKind(value as ReviewKind);
              }}
              aria-label="Review cadence"
            >
              <SegmentedControlItem value="weekly">Weekly</SegmentedControlItem>
              <SegmentedControlItem value="monthly">Monthly</SegmentedControlItem>
              <SegmentedControlItem value="quarterly">Quarterly</SegmentedControlItem>
            </SegmentedControl>
            <div className="mt-4">
              <ReviewBlock kind={reviewKind} review={currentReview} />
            </div>
          </Panel>

          <RelevantContextPanel
            scope={{ module: "strategy" }}
            title="Relevant context for this review"
            limit={6}
          />

          {/* Portfolio (progressive disclosure) */}
          <Panel
            id="portfolio"
            title="Portfolio view"
            icon={<Layers className="size-3.5" aria-hidden="true" />}
            description={`${state.portfolio.length} initiative(s)`}
            collapsible
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">
                  <tr>
                    <th className="py-1 pr-3">Name</th>
                    <th className="py-1 pr-3">Status</th>
                    <th className="py-1 pr-3">Priority</th>
                    <th className="py-1 pr-3">Risk</th>
                    <th className="py-1">Progress</th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  {state.portfolio.map((item) => (
                    <tr key={item.id} className="border-border border-t">
                      <td className="py-1.5 pr-3">{item.name}</td>
                      <td className="py-1.5 pr-3">{item.status.replace("_", " ")}</td>
                      <td className="py-1.5 pr-3 capitalize">{item.priority}</td>
                      <td className="py-1.5 pr-3 capitalize">{item.risk}</td>
                      <td className="py-1.5">{item.progress === null ? "—" : `${item.progress}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Strategic debt + changes + allocation (progressive disclosure) */}
          <Panel
            id="debt"
            title="Strategic debt"
            icon={<Timer className="size-3.5" aria-hidden="true" />}
            description={`${state.strategicDebt.length} unresolved item(s) — nothing is modified automatically`}
            collapsible
          >
            {state.strategicDebt.length === 0 ? (
              <p className="text-muted text-sm">No accumulated strategic debt detected.</p>
            ) : (
              <ul className="space-y-2">
                {state.strategicDebt.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="text-foreground">{item.item}</p>
                      <p className="text-subtle text-xs">
                        {item.ageDays} day(s) old · {item.source} · {item.recommendedReview}
                      </p>
                    </div>
                    <span className="text-muted shrink-0 text-xs capitalize">{item.impact} impact</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            id="changes"
            title="Change detection"
            icon={<ArrowRight className="size-3.5" aria-hidden="true" />}
            description="Meaningful changes from history / audit signals"
            collapsible
          >
            {state.changes.length === 0 ? (
              <p className="text-muted text-sm">
                Change history is limited right now — not enough recorded activity to compare.
              </p>
            ) : (
              <ul className="text-foreground space-y-1 text-sm">
                {state.changes.map((change) => (
                  <li key={change.id}>
                    <span className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">
                      {change.kind} · {change.area}
                    </span>{" "}
                    {change.statement}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {state.allocation.length > 0 ? (
            <Panel
              id="allocation"
              title="Resource allocation"
              icon={<Scale className="size-3.5" aria-hidden="true" />}
              description="Allocation vs stated strategic priority. The engine does not rebalance."
              collapsible
            >
              <ul className="space-y-3">
                {state.allocation.map((row) => (
                  <li key={row.area}>
                    <p className="text-foreground text-sm">
                      <span className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">
                        {row.area}
                      </span>{" "}
                      {row.statement}
                    </p>
                    <EvidenceList items={row.evidence} />
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </>
      )}
    </PageContainer>
  );
}
