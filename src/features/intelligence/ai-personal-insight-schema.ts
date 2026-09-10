import { z } from "zod";
import type { BrainModuleId } from "@/features/brain-hub";

export const AI_INSIGHT_CATEGORIES = [
  "DAILY_BRIEF",
  "MODULE_REVIEW",
  "RECOMMENDATION_EXPLANATION",
] as const;

export type AiInsightCategory = (typeof AI_INSIGHT_CATEGORIES)[number];

export const aiInsightCategorySchema = z.enum(AI_INSIGHT_CATEGORIES);

const moduleIdSchema = z.enum(["goals", "plan", "focus", "act", "grow", "analytics"]);

export const groundedFactSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(220),
});

export type GroundedFact = z.infer<typeof groundedFactSchema>;

export const aiPersonalInsightContextSchema = z.object({
  category: aiInsightCategorySchema,
  moduleId: moduleIdSchema.nullable().default(null),
  title: z.string().min(1).max(160),
  deterministicSummary: z.string().min(1).max(700),
  deterministicRecommendation: z.string().min(1).max(500),
  facts: z.array(groundedFactSchema).min(1).max(12),
  limitations: z.array(z.string().min(1).max(180)).max(6),
  sourceInsightIds: z.array(z.string().min(1).max(120)).min(1).max(8),
});

export type AiPersonalInsightContext = z.infer<typeof aiPersonalInsightContextSchema>;

const modelPersonalInsightSchema = z.object({
  summary: z.string().trim().min(1).max(400),
  interpretation: z.string().trim().min(1).max(600),
  recommendations: z.array(z.string().trim().min(1).max(220)).min(1).max(3),
  limitations: z.array(z.string().trim().min(1).max(220)).max(4),
  factRefs: z.array(z.number().int().min(0)).min(1).max(8),
});

export const aiPersonalInsightResponseSchema = z.object({
  summary: z.string().trim().min(1).max(400),
  facts: z.array(groundedFactSchema).min(1).max(8),
  interpretation: z.string().trim().min(1).max(600),
  recommendations: z.array(z.string().trim().min(1).max(220)).min(1).max(3),
  limitations: z.array(z.string().trim().min(1).max(220)).max(4),
});

export type AiPersonalInsightResponse = z.infer<typeof aiPersonalInsightResponseSchema>;

export function materializeAiInsightResponse(
  modelOutput: unknown,
  context: AiPersonalInsightContext,
): AiPersonalInsightResponse {
  const parsed = modelPersonalInsightSchema.parse(modelOutput);
  const uniqueRefs = Array.from(new Set(parsed.factRefs));
  const facts = uniqueRefs
    .map((index) => context.facts[index])
    .filter((fact): fact is GroundedFact => Boolean(fact));

  if (facts.length === 0 || facts.length !== uniqueRefs.length) {
    throw new Error("AI insight cited unsupported facts");
  }

  return aiPersonalInsightResponseSchema.parse({
    summary: parsed.summary,
    facts,
    interpretation: parsed.interpretation,
    recommendations: parsed.recommendations,
    limitations: parsed.limitations,
  });
}

export function toModuleLabel(moduleId: BrainModuleId | null | undefined): string {
  if (moduleId === "goals") return "Goals";
  if (moduleId === "plan") return "Plan";
  if (moduleId === "focus") return "Focus";
  if (moduleId === "act") return "Act";
  if (moduleId === "grow") return "Grow";
  if (moduleId === "analytics") return "Analytics";
  return "System";
}
