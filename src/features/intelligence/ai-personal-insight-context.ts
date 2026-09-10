import type { BrainModuleId } from "@/features/brain-hub";
import type { MasteryInsight } from "./mastery-intelligence";
import {
  aiPersonalInsightContextSchema,
  type AiInsightCategory,
  type AiPersonalInsightContext,
  type GroundedFact,
  toModuleLabel,
} from "./ai-personal-insight-schema";

export interface BuildAiContextInput {
  moduleId?: BrainModuleId;
  insights: MasteryInsight[];
  attentionCount: number;
  recommendationCount: number;
}

export function hasSufficientDataForAi(input: BuildAiContextInput): boolean {
  return input.insights.length > 0;
}

function categoryFor(moduleId?: BrainModuleId): AiInsightCategory {
  return moduleId ? "MODULE_REVIEW" : "DAILY_BRIEF";
}

function topInsight(insights: MasteryInsight[]): MasteryInsight {
  return insights[0]!;
}

function buildFacts(input: BuildAiContextInput, top: MasteryInsight): GroundedFact[] {
  const facts: GroundedFact[] = [
    {
      id: "insights-total",
      label: "Active deterministic insights",
      value: String(input.insights.length),
    },
    {
      id: "attention-total",
      label: "Attention insights",
      value: String(input.attentionCount),
    },
    {
      id: "recommendations-total",
      label: "Recommendation insights",
      value: String(input.recommendationCount),
    },
    {
      id: "top-title",
      label: "Top deterministic insight",
      value: top.title,
    },
    {
      id: "top-fact",
      label: "Top deterministic fact",
      value: top.summary,
    },
  ];

  if (top.evidence[0]) {
    facts.push({
      id: "top-evidence-1",
      label: "Supporting evidence",
      value: top.evidence[0],
    });
  }

  return facts.slice(0, 8);
}

export function buildAiPersonalInsightContext(
  input: BuildAiContextInput,
): AiPersonalInsightContext | null {
  if (!hasSufficientDataForAi(input)) return null;

  const top = topInsight(input.insights);
  const moduleLabel = toModuleLabel(input.moduleId);
  const context = {
    category: categoryFor(input.moduleId),
    moduleId: input.moduleId ?? null,
    title: input.moduleId ? `${moduleLabel} AI review` : "Your Mastery brief",
    deterministicSummary: top.detail,
    deterministicRecommendation: top.recommendation,
    facts: buildFacts(input, top),
    limitations:
      top.confidence === "low"
        ? ["The available data sample is limited for this interpretation."]
        : [],
    sourceInsightIds: input.insights.slice(0, 5).map((insight) => insight.id),
  };

  return aiPersonalInsightContextSchema.parse(context);
}

export function buildAiInsightCacheKey(
  moduleId: BrainModuleId | undefined,
  sourceInsightIds: string[],
): string {
  return ["v1", moduleId ?? "global", ...sourceInsightIds].join("|");
}
