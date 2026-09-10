"use client";

import { useCallback, useMemo, useState } from "react";
import { defaultDecisionCriteria, buildDecisionRecommendation } from "./decision-model";
import type { DecisionOption, DecisionRecord, DecisionStatus } from "./schema";

const STORAGE_KEY = "mastery.decisions.local";

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildDecisionDraft(overrides: Partial<DecisionRecord> = {}): DecisionRecord {
  const now = new Date().toISOString();
  const id = overrides.id ?? createId("decision");
  const options =
    overrides.options?.length
      ? overrides.options
      : [
          {
            id: createId("option"),
            decisionId: id,
            title: "Option A",
            description: "Protect the current plan and maintain focus.",
            expectedBenefits: ["Less disruption to current execution."],
            expectedCosts: ["Potentially slower long-term upside."],
            requiredEffort: "medium" as const,
            risks: ["Opportunity may be missed."],
            dependencies: ["No major dependencies"],
            opportunityCosts: ["Potential learning opportunity is deferred."],
            goalAlignment: 72,
            constraints: ["Current capacity remains stable."],
            evidence: ["Current plan is already active."],
            assumptions: ["Execution remains stable."],
            scenarioResults: ["Expected outcome stays on course."],
            criteriaScores: {
              "goal-alignment": 7,
              "time-cost": 8,
              risk: 6,
              "learning-value": 5,
            },
          },
          {
            id: createId("option"),
            decisionId: id,
            title: "Option B",
            description: "Take a more ambitious route while deliberately managing risk.",
            expectedBenefits: ["Higher strategic upside."],
            expectedCosts: ["Requires additional focus and planning."],
            requiredEffort: "high" as const,
            risks: ["Execution may slip under workload pressure."],
            dependencies: ["Protect time blocks"],
            opportunityCosts: ["Reduced flexibility in other priorities."],
            goalAlignment: 86,
            constraints: ["Requires schedule protection"],
            evidence: ["The strategy delivers strategic leverage."],
            assumptions: ["The user can protect focus time."],
            scenarioResults: ["Best outcome if workload stays disciplined."],
            criteriaScores: {
              "goal-alignment": 9,
              "time-cost": 5,
              risk: 4,
              "learning-value": 8,
            },
          },
        ];

  return {
    id,
    title: overrides.title ?? "Choose the next strategic step",
    description:
      overrides.description ??
      "Define the situation, capture constraints, compare options, and decide transparently.",
    status: overrides.status ?? "DRAFT",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    decisionDate: overrides.decisionDate ?? new Date().toISOString().slice(0, 10),
    dueDate: overrides.dueDate,
    domain: overrides.domain ?? "plan",
    importance: overrides.importance ?? "medium",
    urgency: overrides.urgency ?? "medium",
    context: overrides.context ?? "Current state is being established. Add the facts and constraints that matter.",
    desiredOutcome: overrides.desiredOutcome ?? "Choose the option that best supports the user’s goals.",
    userPriority: overrides.userPriority ?? "balance growth and capacity",
    constraints: overrides.constraints ?? ["keep execution realistic", "protect focus"],
    assumptions: overrides.assumptions ?? ["The user will review the trade-offs before acting."],
    relatedGoals: overrides.relatedGoals ?? [],
    relatedPlans: overrides.relatedPlans ?? [],
    relatedPredictions: overrides.relatedPredictions ?? [],
    relatedRecommendations: overrides.relatedRecommendations ?? [],
    selectedOptionId: overrides.selectedOptionId ?? null,
    criteria: overrides.criteria?.length ? overrides.criteria : defaultDecisionCriteria,
    options,
    tradeOffs: overrides.tradeOffs ?? [],
    risks: overrides.risks ?? [],
    scenarios: overrides.scenarios ?? [],
    evidence: overrides.evidence ?? [],
    recommendation:
      overrides.recommendation ??
      buildDecisionRecommendation({
        id,
        options,
        assumptions: overrides.assumptions ?? ["The user will review the trade-offs before acting."],
        criteria: overrides.criteria?.length ? overrides.criteria : defaultDecisionCriteria,
        title: overrides.title ?? "Choose the next strategic step",
      }) ?? undefined,
    reviewDate: overrides.reviewDate,
  } satisfies DecisionRecord;
}

function readDecisions(): DecisionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as DecisionRecord[]) : [];
  } catch {
    return [];
  }
}

function writeDecisions(next: DecisionRecord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Convenience store only — safe to ignore.
  }
}

export function useDecisions() {
  const [decisions, setDecisions] = useState<DecisionRecord[]>(() => readDecisions());
  const [currentDecisionId, setCurrentDecisionId] = useState<string | null>(() => {
    const loaded = readDecisions();
    return loaded[0]?.id ?? null;
  });

  const persist = useCallback((next: DecisionRecord[]) => {
    setDecisions(next);
    writeDecisions(next);
  }, []);

  const currentDecision = useMemo(
    () => decisions.find((item) => item.id === currentDecisionId) ?? decisions[0] ?? null,
    [currentDecisionId, decisions],
  );

  const createDecision = useCallback(
    (overrides: Partial<DecisionRecord> = {}) => {
      const next = buildDecisionDraft(overrides);
      persist([next, ...decisions]);
      setCurrentDecisionId(next.id);
      return next;
    },
    [decisions, persist],
  );

  const updateDecision = useCallback(
    (id: string, patch: Partial<DecisionRecord>) => {
      const next = decisions.map((decision) =>
        decision.id === id ? { ...decision, ...patch, updatedAt: new Date().toISOString() } : decision,
      );
      persist(next);
      return next.find((decision) => decision.id === id) ?? null;
    },
    [decisions, persist],
  );

  const updateCriterionWeight = useCallback(
    (decisionId: string, criterionId: string, weight: number) => {
      const next = decisions.map((decision) => {
        if (decision.id !== decisionId) return decision;
        return {
          ...decision,
          criteria: decision.criteria.map((criterion) =>
            criterion.id === criterionId ? { ...criterion, weight } : criterion,
          ),
          updatedAt: new Date().toISOString(),
        };
      });
      persist(next);
    },
    [decisions, persist],
  );

  const addOption = useCallback(
    (decisionId: string, option: Omit<DecisionOption, "id" | "decisionId">) => {
      const next = decisions.map((decision) => {
        if (decision.id !== decisionId) return decision;
        const draft: DecisionOption = {
          id: createId("option"),
          decisionId,
          ...option,
        };
        return {
          ...decision,
          options: [...decision.options, draft],
          updatedAt: new Date().toISOString(),
        };
      });
      persist(next);
    },
    [decisions, persist],
  );

  const chooseOption = useCallback(
    (decisionId: string, optionId: string, choiceType: "CHOOSE" | "DEFER" | "REJECT" | "CONTINUE_ANALYSIS") => {
      const next = decisions.map((decision) => {
        if (decision.id !== decisionId) return decision;
        const updated: DecisionRecord = {
          ...decision,
          selectedOptionId: choiceType === "CHOOSE" ? optionId : null,
          status: (choiceType === "CHOOSE"
            ? "DECIDED"
            : choiceType === "DEFER"
              ? "DEFERRED"
              : choiceType === "REJECT"
                ? "REJECTED"
                : "ANALYZING") as DecisionRecord["status"],
          updatedAt: new Date().toISOString(),
        };
        return updated;
      });
      persist(next);
    },
    [decisions, persist],
  );

  return {
    decisions,
    currentDecision,
    currentDecisionId,
    setCurrentDecisionId,
    createDecision,
    updateDecision,
    updateCriterionWeight,
    addOption,
    chooseOption,
  };
}

export function createDecisionSeedDecision(): DecisionRecord {
  return buildDecisionDraft({
    title: "Start a new certification",
    domain: "grow",
    context: "There is a credible skill gap and rising opportunity, but current workload is elevated.",
    desiredOutcome: "Increase long-term growth without harming delivery momentum.",
    userPriority: "maximize learning while protecting execution quality",
    constraints: ["limited focus time", "delivery targets still matter"],
    assumptions: ["The user can protect 3 focused learning blocks per week."],
    relatedGoals: ["current-priority-goal"],
    relatedPlans: ["current-quarter-plan"],
    relatedPredictions: ["workload-risk"],
    status: "ANALYZING",
    criteria: defaultDecisionCriteria,
    options: [
      {
        id: createId("option"),
        decisionId: "decision-seed",
        title: "Start now with a focused learning sprint",
        description: "Commence the certification immediately while protecting a limited study window.",
        expectedBenefits: ["Quick learning momentum", "Real skill gain"],
        expectedCosts: ["More workload in the near term"],
        requiredEffort: "medium",
        risks: ["Pacing may be too aggressive"],
        dependencies: ["Protect time blocks"],
        opportunityCosts: ["Reduced recovery capacity"],
        goalAlignment: 87,
        constraints: ["Study must fit within current focus blocks"],
        evidence: ["Current programs show a gap in this skill area."],
        assumptions: ["The user can maintain weekly study blocks."],
        scenarioResults: ["Works well if study blocks stay protected."],
        criteriaScores: {
          "goal-alignment": 9,
          "time-cost": 6,
          risk: 5,
          "learning-value": 9,
        },
      },
      {
        id: createId("option"),
        decisionId: "decision-seed",
        title: "Delay until the next planning window",
        description: "Keep delivery stable and revisit the certification after current priorities settle.",
        expectedBenefits: ["Lower workload disruption", "Maintain execution stability"],
        expectedCosts: ["Slower learning momentum"],
        requiredEffort: "low",
        risks: ["Momentum may stall"],
        dependencies: ["No immediate dependencies"],
        opportunityCosts: ["Potential near-term competitive advantage is deferred"],
        goalAlignment: 70,
        constraints: ["No major change to current priorities"],
        evidence: ["Current workload is already elevated."],
        assumptions: ["Current workload remains steady."],
        scenarioResults: ["Low risk but lower learning upside."],
        criteriaScores: {
          "goal-alignment": 7,
          "time-cost": 9,
          risk: 8,
          "learning-value": 5,
        },
      },
    ],
  });
}

export type DecisionStatusChoice = DecisionStatus;
