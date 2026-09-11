"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FlaskConical, Plus, X } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState } from "@/components/shared";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  HORIZON_LABEL,
  SIM_CONFIDENCE_LABEL,
  VALUE_KIND_LABEL,
  defaultAssumptions,
  type Assumption,
  type Metric,
  type Scenario,
  type ScenarioChange,
  type ScenarioOp,
  type SimHorizon,
  type SimulationResult,
} from "../digital-twin";
import { useDigitalTwin } from "../use-digital-twin";

const OPS: ScenarioOp[] = [
  "ADD",
  "REMOVE",
  "DEFER",
  "ACCELERATE",
  "REDUCE",
  "RESCHEDULE",
  "REPRIORITIZE",
  "PAUSE",
  "COMPLETE",
];
const TARGET_KINDS: ScenarioChange["targetKind"][] = [
  "goal",
  "plan",
  "project",
  "task",
  "commitment",
  "deadline",
];
const HORIZONS: SimHorizon[] = ["1w", "1m", "3m", "6m", "12m"];

const KIND_STYLE: Record<Metric["kind"], string> = {
  fact: "text-foreground",
  estimate: "text-primary",
  projection: "text-warning",
  assumption: "text-subtle",
};

function Panel({
  id,
  title,
  icon,
  children,
  description,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  description?: string;
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

function MetricList({ metrics }: { metrics: Metric[] }) {
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {metrics.map((metric) => (
        <div key={metric.key} className="flex items-baseline justify-between gap-2 text-sm">
          <dt className="text-muted">{metric.label}</dt>
          <dd className="flex items-baseline gap-1.5">
            <span className={cn("font-semibold tabular-nums", KIND_STYLE[metric.kind])}>
              {metric.value}
              {metric.unit ? ` ${metric.unit}` : ""}
            </span>
            <span className="text-subtle text-[0.5625rem] tracking-[0.08em] uppercase">
              {VALUE_KIND_LABEL[metric.kind]}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function StringList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="text-muted text-sm">{empty}</p>;
  return (
    <ul className="text-foreground list-disc space-y-0.5 pl-5 text-sm">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export function SimulationView() {
  const { status, baseline, calibration, library, simulate, compare, applyPreview } = useDigitalTwin();

  const [name, setName] = useState("New scenario");
  const [horizon, setHorizon] = useState<SimHorizon>("1m");
  const [changes, setChanges] = useState<ScenarioChange[]>([]);
  const [assumptions, setAssumptions] = useState<Assumption[]>(() =>
    defaultAssumptions(baseline, calibration),
  );
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [applyFor, setApplyFor] = useState<Scenario | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const workingScenario = useMemo<Scenario>(
    () => ({
      id: "working",
      name,
      horizon,
      changes,
      assumptions,
      status: "DRAFT",
      version: 1,
      createdAt: baseline.generatedAt,
      updatedAt: baseline.generatedAt,
    }),
    [name, horizon, changes, assumptions, baseline.generatedAt],
  );

  const comparison = useMemo(
    () => (compareIds.length > 0 ? compare(compareIds) : []),
    [compareIds, compare],
  );

  const addChange = () => {
    setChanges((current) => [
      ...current,
      {
        id: `chg-${current.length}-${Date.now().toString(36)}`,
        op: "ADD",
        targetKind: "project",
        targetLabel: "",
        params: { hours: 4 },
      },
    ]);
  };

  const patchChange = (id: string, patch: Partial<ScenarioChange>) =>
    setChanges((current) => current.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const setAssumptionValue = (key: string, value: number) =>
    setAssumptions((current) => current.map((a) => (a.key === key ? { ...a, value } : a)));

  const run = () => setResult(simulate(workingScenario));

  const saveWorking = () => {
    library.create({ name, horizon, changes, assumptions });
  };

  const applyPreviewData = applyFor ? applyPreview(applyFor) : null;

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Simulation"
        description="A sandbox for “what if?”. Your real MASTERY state is never touched until you explicitly apply a scenario."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button asChild size="sm" variant="ghost">
            <Link href="/command">Exit simulation</Link>
          </Button>
        }
      />

      <div
        role="status"
        className="border-warning/40 bg-warning/10 text-warning flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase"
      >
        <FlaskConical className="size-3.5" aria-hidden="true" />
        Simulation mode — nothing here changes your real data
      </div>

      {status === "loading" ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : !baseline.hasData ? (
        <EmptyState
          icon={<FlaskConical aria-hidden="true" />}
          title="Insufficient data for reliable simulation"
          description="Add goals, plans and tasks and the twin can build a baseline to simulate against. You can still draft a scenario and enter assumptions manually."
        />
      ) : null}

      <Panel
        id="baseline"
        title="Baseline — current operational state"
        description={`As of ${baseline.generatedAt.slice(0, 10)}. Facts, estimates and one editable capacity assumption.`}
      >
        <MetricList metrics={baseline.metrics} />
        <p className="text-subtle text-xs">
          Capacity: planned {baseline.capacity.plannedFocusHours}h/wk vs configured{" "}
          {baseline.capacity.availableFocusHoursPerWeek}h/wk ·{" "}
          {baseline.capacity.overCommitted ? "over-committed" : `${baseline.capacity.unallocatedFocusHours}h/wk unallocated`}
          {calibration.estimateOverrunFactor != null
            ? ` · history: actuals run ${calibration.estimateOverrunFactor}× estimates (${calibration.sampleSize} tasks)`
            : " · no historical calibration yet"}
        </p>
      </Panel>

      <Panel id="editor" title="Scenario editor" icon={<Plus className="size-3.5" aria-hidden="true" />}>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-label="Scenario name"
            className="max-w-xs"
          />
          <label className="text-muted flex items-center gap-1.5 text-sm">
            Horizon
            <select
              value={horizon}
              onChange={(event) => setHorizon(event.target.value as SimHorizon)}
              className="border-border bg-surface rounded-md border px-2 py-1 text-sm"
              aria-label="Simulation horizon"
            >
              {HORIZONS.map((h) => (
                <option key={h} value={h}>
                  {HORIZON_LABEL[h]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-subtle text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
            Changes
          </p>
          {changes.length === 0 ? (
            <p className="text-muted text-sm">No changes yet — add one to simulate.</p>
          ) : (
            <ul className="space-y-2">
              {changes.map((change) => (
                <li key={change.id} className="border-border flex flex-wrap items-center gap-2 rounded-lg border p-2">
                  <select
                    value={change.op}
                    onChange={(event) => patchChange(change.id, { op: event.target.value as ScenarioOp })}
                    className="border-border bg-surface rounded-md border px-2 py-1 text-sm"
                    aria-label="Change operation"
                  >
                    {OPS.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                  <select
                    value={change.targetKind}
                    onChange={(event) =>
                      patchChange(change.id, { targetKind: event.target.value as ScenarioChange["targetKind"] })
                    }
                    className="border-border bg-surface rounded-md border px-2 py-1 text-sm"
                    aria-label="Change target kind"
                  >
                    {TARGET_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {kind}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={change.targetLabel}
                    onChange={(event) => patchChange(change.id, { targetLabel: event.target.value })}
                    placeholder="label"
                    aria-label="Change target label"
                    className="max-w-[10rem]"
                  />
                  <Input
                    type="number"
                    value={change.params.hours ?? change.params.days ?? change.params.pct ?? 0}
                    onChange={(event) => {
                      const value = Number(event.target.value) || 0;
                      const paramKey =
                        change.op === "DEFER" || change.op === "RESCHEDULE"
                          ? "days"
                          : change.op === "REPRIORITIZE"
                            ? "pct"
                            : "hours";
                      patchChange(change.id, { params: { [paramKey]: value } });
                    }}
                    aria-label="Change amount"
                    className="max-w-[6rem]"
                  />
                  <button
                    type="button"
                    onClick={() => setChanges((current) => current.filter((c) => c.id !== change.id))}
                    aria-label="Remove change"
                    className="text-subtle hover:text-danger ml-auto rounded p-1"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Button type="button" size="sm" variant="secondary" onClick={addChange}>
            <Plus className="size-3.5" aria-hidden="true" />
            Add change
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-subtle text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
            Assumptions (editable — labelled, not measured)
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {assumptions.map((assumption) => (
              <label key={assumption.id} className="text-muted flex flex-col gap-1 text-xs">
                {assumption.label} ({assumption.unit})
                <Input
                  type="number"
                  step="0.1"
                  value={assumption.value}
                  onChange={(event) => setAssumptionValue(assumption.key, Number(event.target.value) || 0)}
                  aria-label={assumption.label}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={run}>
            Run simulation
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={saveWorking}>
            Save scenario
          </Button>
        </div>
      </Panel>

      {result ? (
        <Panel
          id="result"
          title={`Result — ${result.scenarioName}`}
          description={`Horizon ${HORIZON_LABEL[result.horizon]} · ${SIM_CONFIDENCE_LABEL[result.confidence]}`}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-subtle mb-1 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
                Baseline
              </p>
              <MetricList metrics={result.baseline} />
            </div>
            <div>
              <p className="text-subtle mb-1 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
                Projected
              </p>
              <MetricList metrics={result.projected} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-subtle mb-1 text-xs font-semibold uppercase">Changes</p>
              <StringList items={result.changes} empty="None." />
            </div>
            <div>
              <p className="text-subtle mb-1 text-xs font-semibold uppercase">Affected areas</p>
              <StringList items={result.affectedAreas} empty="None." />
            </div>
            <div>
              <p className="text-subtle mb-1 text-xs font-semibold uppercase">Potential outcomes</p>
              <StringList items={result.outcomes} empty="None." />
            </div>
            <div>
              <p className="text-subtle mb-1 text-xs font-semibold uppercase">Risks</p>
              <StringList items={result.risks} empty="None flagged." />
            </div>
            <div>
              <p className="text-subtle mb-1 text-xs font-semibold uppercase">Trade-offs</p>
              <StringList items={result.tradeOffs} empty="None flagged." />
            </div>
            <div>
              <p className="text-subtle mb-1 text-xs font-semibold uppercase">Limitations</p>
              <StringList items={result.limitations} empty="None." />
            </div>
          </div>

          <p className="text-subtle text-xs">
            Facts and estimates come from your data; projections are model output, not
            predictions. Applying a scenario is a separate, explicit step.
          </p>
        </Panel>
      ) : null}

      <Panel
        id="library"
        title={`Scenario library (${library.scenarios.length})`}
        description="Saved what-if configurations. Not plans — each has a status and a version."
      >
        {library.scenarios.length === 0 ? (
          <p className="text-muted text-sm">No saved scenarios yet.</p>
        ) : (
          <ul className="space-y-2">
            {library.scenarios.map((scenario) => (
              <li
                key={scenario.id}
                className="border-border flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"
              >
                <div className="min-w-0">
                  <p className="text-foreground text-sm font-medium">
                    {scenario.name}{" "}
                    <span className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">
                      v{scenario.version} · {scenario.status.toLowerCase()}
                    </span>
                  </p>
                  <p className="text-subtle text-xs">
                    {scenario.changes.length} change(s) · {HORIZON_LABEL[scenario.horizon]}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    className="text-primary text-xs hover:underline"
                    onClick={() => setResult(simulate(scenario))}
                  >
                    Simulate
                  </button>
                  <button
                    type="button"
                    className="text-primary text-xs hover:underline"
                    onClick={() =>
                      setCompareIds((current) =>
                        current.includes(scenario.id)
                          ? current.filter((id) => id !== scenario.id)
                          : [...current, scenario.id].slice(-3),
                      )
                    }
                  >
                    {compareIds.includes(scenario.id) ? "Uncompare" : "Compare"}
                  </button>
                  <button
                    type="button"
                    className="text-muted hover:text-foreground text-xs"
                    onClick={() => library.duplicate(scenario.id)}
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="text-muted hover:text-foreground text-xs"
                    onClick={() => library.setStatus(scenario.id, "ARCHIVED")}
                  >
                    Archive
                  </button>
                  <button
                    type="button"
                    className="text-muted hover:text-foreground text-xs"
                    onClick={() => setApplyFor(scenario)}
                  >
                    Apply…
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {comparison.length > 0 ? (
        <Panel id="comparison" title="Scenario comparison">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">
                <tr>
                  <th className="py-1 pr-3">Metric</th>
                  <th className="py-1 pr-3">Baseline</th>
                  {comparison[0]?.scenarios.map((scenario) => (
                    <th key={scenario.scenarioId} className="py-1 pr-3">
                      {scenario.scenarioName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-foreground">
                {comparison.map((row) => (
                  <tr key={row.key} className="border-border border-t">
                    <td className="py-1.5 pr-3">{row.label}</td>
                    <td className="py-1.5 pr-3 tabular-nums">
                      {row.baseline}
                      {row.unit ? ` ${row.unit}` : ""}
                    </td>
                    {row.scenarios.map((scenario) => (
                      <td key={scenario.scenarioId} className="py-1.5 pr-3 tabular-nums">
                        {scenario.value}
                        {row.unit ? ` ${row.unit}` : ""}{" "}
                        <span className={cn("text-xs", scenario.delta >= 0 ? "text-success" : "text-danger")}>
                          ({scenario.delta >= 0 ? "+" : ""}
                          {scenario.delta})
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      <Dialog open={applyFor !== null} onOpenChange={(open) => !open && setApplyFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply “{applyFor?.name}”?</DialogTitle>
            <DialogDescription>
              {applyPreviewData?.note}
            </DialogDescription>
          </DialogHeader>
          {applyPreviewData ? (
            <div className="space-y-2 text-sm">
              <p className="text-foreground">
                This would modify: {applyPreviewData.willModify.goals} goal(s),{" "}
                {applyPreviewData.willModify.plans} plan(s), {applyPreviewData.willModify.tasks} task(s),{" "}
                {applyPreviewData.willModify.deadlines} deadline(s).
              </p>
              <ul className="text-muted list-disc space-y-0.5 pl-5 text-xs">
                {applyPreviewData.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
              <p className="text-subtle text-xs">
                In this build, applying records the scenario as APPLIED for your audit trail;
                the underlying goal / plan / task changes are made in their own modules using
                the existing forms and authorization.
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setApplyFor(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (applyFor) library.setStatus(applyFor.id, "APPLIED");
                setApplyFor(null);
              }}
            >
              Mark applied
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
