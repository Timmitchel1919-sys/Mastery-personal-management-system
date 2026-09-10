"use client";

import { useEffect, useMemo } from "react";
import { useGoals } from "@/features/goals/use-goals";
import { usePredictions } from "@/features/predictions/use-predictions";
import { buildDecisionRecommendation, scoreDecisionOption } from "./decision-model";
import { createDecisionSeedDecision, useDecisions } from "./use-decisions";

export function DecisionWorkspace() {
  const goals = useGoals();
  const predictions = usePredictions();
  const { decisions, currentDecision, createDecision, updateDecision, updateCriterionWeight, chooseOption } =
    useDecisions();

  useEffect(() => {
    if (decisions.length === 0) {
      const draft = createDecisionSeedDecision();
      createDecision(draft);
    }
  }, [createDecision, decisions.length]);

  const decision = currentDecision ?? decisions[0] ?? null;

  const recommendation = useMemo(() => {
    if (!decision) return null;
    return decision.recommendation ?? buildDecisionRecommendation(decision);
  }, [decision]);

  const scoredOptions = useMemo(() => {
    if (!decision) return [];
    return decision.options.map((option) => ({
      option,
      score: scoreDecisionOption(option, decision.criteria),
    }));
  }, [decision]);

  if (!decision) {
    return <div className="mx-auto max-w-6xl px-4 py-12 text-sm text-slate-500">Loading decision workspace…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Decision workspace</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{decision.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">{decision.status}</span>
            <button
              type="button"
              onClick={() => createDecision({ title: `Decision ${decisions.length + 1}` })}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-400 hover:text-sky-700"
            >
              New decision
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_0.7fr]">
        <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Title</label>
            <input
              value={decision.title}
              onChange={(event) => updateDecision(decision.id, { title: event.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-sky-500"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Context</label>
            <textarea
              value={decision.context}
              onChange={(event) => updateDecision(decision.id, { context: event.target.value })}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Domain</label>
              <input
                value={decision.domain}
                onChange={(event) => updateDecision(decision.id, { domain: event.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Due date</label>
              <input
                type="date"
                value={decision.dueDate ?? decision.decisionDate}
                onChange={(event) => updateDecision(decision.id, { dueDate: event.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Desired outcome</label>
            <textarea
              value={decision.desiredOutcome}
              onChange={(event) => updateDecision(decision.id, { desiredOutcome: event.target.value })}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500"
            />
          </div>
        </section>

        <aside className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Signals</h2>
            <div className="mt-4 space-y-3">
              {predictions.signals.slice(0, 3).map((signal) => (
                <div key={signal.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">{signal.category}</p>
                  <p className="mt-2 text-sm font-medium text-slate-800">{signal.prediction}</p>
                  <p className="mt-2 text-xs text-slate-500">{signal.confidence} confidence</p>
                </div>
              ))}
              {!predictions.signals.length && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                  No predictive signals are available yet.
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Goals</h2>
            <div className="mt-4 space-y-2">
              {goals.items.slice(0, 4).map((goal) => (
                <div key={goal.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">{goal.title}</span>
                    <span className="text-xs text-slate-500">{goal.progress}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-sky-500" style={{ width: `${goal.progress}%` }} />
                  </div>
                </div>
              ))}
              {!goals.items.length && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                  No active goals found.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Criteria weighting</h2>
          <span className="text-sm text-slate-500">Higher weight = greater priority</span>
        </div>

        <div className="space-y-4">
          {decision.criteria.map((criterion) => (
            <div key={criterion.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{criterion.name}</p>
                  <p className="text-xs text-slate-500">{criterion.description}</p>
                </div>
                <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                  {criterion.weight.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={criterion.weight}
                onChange={(event) => updateCriterionWeight(decision.id, criterion.id, Number(event.target.value))}
                className="w-full accent-sky-600"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Options</h2>
          <button
            type="button"
            onClick={() =>
              updateDecision(decision.id, {
                options: [
                  ...decision.options,
                  {
                    id: `option-${decision.options.length + 1}`,
                    decisionId: decision.id,
                    title: `Option ${decision.options.length + 1}`,
                    description: "Add a new option and score it against the same criteria.",
                    expectedBenefits: [],
                    expectedCosts: [],
                    requiredEffort: "medium",
                    risks: [],
                    dependencies: [],
                    opportunityCosts: [],
                    goalAlignment: 50,
                    constraints: [],
                    evidence: [],
                    assumptions: [],
                    scenarioResults: [],
                    criteriaScores: Object.fromEntries(decision.criteria.map((criterion) => [criterion.id, 5])),
                  },
                ],
              })
            }
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Add option
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {scoredOptions.map(({ option, score }) => (
            <div
              key={option.id}
              className={`rounded-2xl border p-5 ${decision.selectedOptionId === option.id ? "border-sky-500 bg-sky-50" : "border-slate-200 bg-slate-50"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{option.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{option.description}</p>
                </div>
                {score && (
                  <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
                    {score.total}/100
                  </span>
                )}
              </div>

              <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                <div>
                  <p className="font-medium text-slate-900">Expected benefits</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {option.expectedBenefits.length ? option.expectedBenefits.map((benefit) => <li key={benefit}>{benefit}</li>) : <li>None listed yet.</li>}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Expected costs</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {option.expectedCosts.length ? option.expectedCosts.map((cost) => <li key={cost}>{cost}</li>) : <li>None listed yet.</li>}
                  </ul>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                  {option.requiredEffort} effort
                </span>
                <button
                  type="button"
                  onClick={() => chooseOption(decision.id, option.id, "CHOOSE")}
                  className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
                >
                  {decision.selectedOptionId === option.id ? "Selected" : "Choose"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Recommendation</h2>
        {recommendation ? (
          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">{recommendation.status}</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">{recommendation.rationale}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white px-2.5 py-1 text-slate-700">confidence: {recommendation.confidence}</span>
              <span className="rounded-full bg-white px-2.5 py-1 text-slate-700">{recommendation.evidence.length} evidence points</span>
            </div>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {recommendation.evidence.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Recommendation pending.</p>
        )}
      </section>
    </div>
  );
}
