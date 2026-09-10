import type { Goal } from "@/features/goals/schema";
import type { PredictiveSignal } from "@/features/predictions/prediction-model";
import type {
  DecisionCriterion,
  DecisionOption,
  DecisionRecommendation,
  DecisionRecord,
} from "./schema";

export type { DecisionCriterion, DecisionOption, DecisionRecommendation, DecisionRecord } from "./schema";

export const defaultDecisionCriteria: DecisionCriterion[] = [
  {
    id: "goal-alignment",
    name: "Goal alignment",
    description: "How closely this option reinforces the user’s stated goals.",
    weight: 0.35,
    direction: "higher",
    userDefined: false,
  },
  {
    id: "time-cost",
    name: "Time cost",
    description: "How much attention and time the option requires.",
    weight: 0.2,
    direction: "lower",
    userDefined: false,
  },
  {
    id: "risk",
    name: "Risk",
    description: "How much downside or uncertainty the option carries.",
    weight: 0.25,
    direction: "lower",
    userDefined: false,
  },
  {
    id: "learning-value",
    name: "Learning value",
    description: "How much strategic learning or leverage the option creates.",
    weight: 0.2,
    direction: "higher",
    userDefined: false,
  },
];

export function scoreDecisionOption(
  option: DecisionOption,
  criteria: DecisionCriterion[],
): { total: number; breakdown: Record<string, number> } | null {
  if (!criteria.length) return null;

  const breakdown: Record<string, number> = {};
  let total = 0;

  for (const criterion of criteria) {
    const score = option.criteriaScores[criterion.id] ?? 0;
    const safeScore = Math.min(10, Math.max(0, Number(score) || 0));
    const adjusted = criterion.direction === "higher" ? safeScore : 10 - safeScore;
    const weighted = adjusted * criterion.weight;
    breakdown[criterion.id] = Number(weighted.toFixed(2));
    total += weighted;
  }

  return {
    total: Number(Math.min(100, total * 10).toFixed(1)),
    breakdown,
  };
}

export function assessReversibility(decision: Pick<DecisionRecord, "options">):
  | "reversible"
  | "partially_reversible"
  | "hard_to_reverse" {
  const optionCount = decision.options.length;
  if (optionCount === 0) return "partially_reversible";

  const totalDependencies = decision.options.reduce(
    (sum, option) => sum + option.dependencies.length + option.opportunityCosts.length,
    0,
  );
  const hasHighRisk = decision.options.some((option) => option.goalAlignment < 50 || option.risks.length > 2);
  const hasMajorTradeoff = decision.options.some(
    (option) => option.dependencies.length >= 2 && option.opportunityCosts.length >= 1,
  );

  if (totalDependencies >= 5 || hasMajorTradeoff || hasHighRisk) return "hard_to_reverse";
  if (totalDependencies >= 2 || hasHighRisk) return "partially_reversible";
  return "reversible";
}

export function buildDecisionRecommendation(
  decision: Pick<DecisionRecord, "id" | "options" | "assumptions" | "criteria" | "title">,
): DecisionRecommendation | null {
  if (!decision.options.length) {
    return {
      decisionId: decision.id,
      recommendedOptionId: null,
      rationale: "Insufficient data to determine a recommendation. Add at least one viable option and score it against the decision criteria.",
      evidence: ["No decision options available yet."],
      assumptions: decision.assumptions.length ? decision.assumptions : ["No explicit assumptions captured yet."],
      confidence: "low",
      limitations: ["Insufficient data."],
      status: "insufficient-data",
    };
  }

  const scored = decision.options
    .map((option) => ({
      option,
      result: scoreDecisionOption(option, decision.criteria.length ? decision.criteria : defaultDecisionCriteria),
    }))
    .filter((entry): entry is { option: DecisionOption; result: { total: number; breakdown: Record<string, number> } } => !!entry.result);

  if (!scored.length) {
    return {
      decisionId: decision.id,
      recommendedOptionId: null,
      rationale: "Insufficient data to determine a recommendation. The current option scores are incomplete.",
      evidence: ["The available criteria have no usable score data."],
      assumptions: decision.assumptions.length ? decision.assumptions : ["No explicit assumptions captured yet."],
      confidence: "low",
      limitations: ["Criteria scores are missing or incomplete."],
      status: "insufficient-data",
    };
  }

  const top = scored.reduce((best, current) => (current.result.total > best.result.total ? current : best));
  const recommendation: DecisionRecommendation = {
    decisionId: decision.id,
    recommendedOptionId: top.option.id,
    rationale: `Based on your selected criteria, “${top.option.title}” is the highest-scoring option for this decision. It balances alignment with your goals while keeping trade-offs and uncertainty explicit.`,
    evidence: [
      `${top.option.title} scored ${top.result.total}/100 using the selected criteria.`,
      `${top.option.expectedBenefits.length} expected benefit${top.option.expectedBenefits.length === 1 ? "" : "s"} listed.`,
      `${top.option.risks.length} risk item${top.option.risks.length === 1 ? "" : "s"} identified.`,
    ],
    assumptions: decision.assumptions.length ? decision.assumptions : ["The current criteria weights reflect the user’s priorities."],
    confidence: top.result.total >= 75 ? "high" : top.result.total >= 55 ? "medium" : "low",
    limitations: [
      "This is a decision score based on selected criteria, not an objective truth.",
      "The recommendation is only as strong as the quality of the evidence and assumptions captured.",
    ],
    status: "recommended",
  };

  return recommendation;
}

export function buildDecisionSignals(
  decision: Pick<DecisionRecord, "title" | "options" | "criteria" | "assumptions">,
  goals: Goal[],
  predictions: PredictiveSignal[],
) {
  return [
    {
      id: `${decision.title}-goal-match`,
      type: "ALIGNMENT" as const,
      title: "Decision alignment",
      summary: `${decision.options.length} option${decision.options.length === 1 ? "" : "s"} are being compared against ${goals.length} linked goal${goals.length === 1 ? "" : "s"}.`,
      detail: "MASTERY estimates alignment using the decision criteria and the user’s current goals, but the final choice remains with the user.",
      recommendation: "Keep the criteria visible and adjust weights before choosing an option.",
      severity: "medium" as const,
      confidence: "medium" as const,
      signal: "moderate" as const,
      source: ["goals", "decisions"],
      relatedModule: "plan" as const,
      actions: [{ label: "Open goals", href: "/plan/goals" }],
      evidence: [
        `${goals.length} goal${goals.length === 1 ? "" : "s"} connected to the current decision context`,
        `${predictions.length} prediction${predictions.length === 1 ? "" : "s"} considered`,
      ],
      createdAt: new Date().toISOString(),
      status: "active" as const,
    },
  ];
}
