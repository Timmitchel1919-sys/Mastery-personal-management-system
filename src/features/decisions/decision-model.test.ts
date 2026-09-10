import { describe, expect, it } from "vitest";
import {
  assessReversibility,
  buildDecisionRecommendation,
  defaultDecisionCriteria,
  scoreDecisionOption,
  type DecisionCriterion,
  type DecisionRecord,
} from "./decision-model";

const criteria: DecisionCriterion[] = [
  { id: "goal-alignment", name: "Goal alignment", description: "", weight: 0.4, direction: "higher", userDefined: false },
  { id: "effort", name: "Effort", description: "", weight: 0.3, direction: "lower", userDefined: false },
  { id: "risk", name: "Risk", description: "", weight: 0.3, direction: "lower", userDefined: false },
];

const createDecision = (): DecisionRecord => ({
  id: "decision-1",
  title: "Take on a new certification",
  description: "A decision about whether to start a certification while maintaining current workload.",
  status: "ANALYZING",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  decisionDate: "2026-01-02",
  dueDate: "2026-01-30",
  domain: "grow",
  importance: "high",
  urgency: "medium",
  context: "Current workload is already elevated, but the accreditation could improve career leverage.",
  desiredOutcome: "Increase long-term skill leverage without causing scheduling strain.",
  userPriority: "maximize learning value",
  constraints: ["time-sensitive", "maintain focus"],
  assumptions: ["current workload remains stable"],
  relatedGoals: ["goal-1"],
  relatedPlans: ["plan-1"],
  relatedPredictions: ["deadline-risk-goal-1"],
  relatedRecommendations: ["recommendation-1"],
  selectedOptionId: null,
  criteria,
  options: [
    {
      id: "option-a",
      decisionId: "decision-1",
      title: "Start certification now",
      description: "Take the course in the next 30 days.",
      expectedBenefits: ["build relevant skill"],
      expectedCosts: ["higher workload"],
      requiredEffort: "medium",
      risks: ["time strain"],
      dependencies: ["clear study blocks"],
      opportunityCosts: ["less time for current goals"],
      goalAlignment: 90,
      constraints: ["needs protected time"],
      evidence: ["current skill gap is visible"],
      assumptions: ["study blocks are available"],
      scenarioResults: ["good outcome if time blocks hold"],
      criteriaScores: { "goal-alignment": 9, effort: 5, risk: 6 },
    },
    {
      id: "option-b",
      decisionId: "decision-1",
      title: "Defer and keep focus on delivery",
      description: "Delay the certification until current plans settle.",
      expectedBenefits: ["protect focus"],
      expectedCosts: ["slower learning"],
      requiredEffort: "low",
      risks: ["learning momentum slows"],
      dependencies: ["no dependency"],
      opportunityCosts: ["miss short-term credential timing"],
      goalAlignment: 70,
      constraints: ["maintain delivery pace"],
      evidence: ["current plan is already full"],
      assumptions: ["delivery remains steady"],
      scenarioResults: ["safe if workload stays stable"],
      criteriaScores: { "goal-alignment": 7, effort: 8, risk: 7 },
    },
  ],
  tradeOffs: [],
  risks: [],
  scenarios: [],
  evidence: [],
  recommendation: undefined,
});

describe("decision-model", () => {
  it("scores options using transparent criteria and does not hide the weights", () => {
    const option = createDecision().options[0];
    if (!option) throw new Error("Expected at least one decision option.");
    const result = scoreDecisionOption(option, criteria);

    expect(result).not.toBeNull();
    expect(result?.total).toBeGreaterThan(0);
    expect(result?.breakdown).toHaveProperty("goal-alignment");
    expect(result?.breakdown).toHaveProperty("effort");
    expect(result?.breakdown).toHaveProperty("risk");
  });

  it("uses the default criteria when the decision does not yet define custom ones", () => {
    expect(defaultDecisionCriteria.length).toBeGreaterThan(0);
    const first = defaultDecisionCriteria[0];
    expect(first).toBeTruthy();
    if (!first) throw new Error("Default decision criteria are missing.");
    expect(first.name).toBeTruthy();
  });

  it("returns insufficient-data guidance when the decision has no workable options", () => {
    const recommendation = buildDecisionRecommendation({
      ...createDecision(),
      options: [],
    });

    expect(recommendation?.rationale).toContain("Insufficient data");
  });

  it("classifies hard-to-reverse decisions when dependencies and impact are high", () => {
    const decision = createDecision();
    const firstOption = decision.options[0];
    if (!firstOption) throw new Error("Expected at least one decision option.");

    expect(assessReversibility({
      ...decision,
      options: [
        {
          ...firstOption,
          dependencies: ["major hiring", "contract sign-off"],
          opportunityCosts: ["burning capital"],
        },
      ],
    })).toBe("hard_to_reverse");
  });
});
