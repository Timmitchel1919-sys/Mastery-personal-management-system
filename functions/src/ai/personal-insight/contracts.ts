import { z } from "zod";

export const AI_INSIGHT_CATEGORIES = [
  "DAILY_BRIEF",
  "MODULE_REVIEW",
  "RECOMMENDATION_EXPLANATION",
] as const;

const aiInsightCategorySchema = z.enum(AI_INSIGHT_CATEGORIES);
const moduleIdSchema = z.enum(["goals", "plan", "focus", "act", "grow", "analytics"]);

export const groundedFactSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(220),
});

export const aiPersonalInsightRequestSchema = z.object({
  category: aiInsightCategorySchema,
  moduleId: moduleIdSchema.nullable().default(null),
  title: z.string().min(1).max(160),
  deterministicSummary: z.string().min(1).max(700),
  deterministicRecommendation: z.string().min(1).max(500),
  facts: z.array(groundedFactSchema).min(1).max(12),
  limitations: z.array(z.string().min(1).max(180)).max(6),
  sourceInsightIds: z.array(z.string().min(1).max(120)).min(1).max(8),
});

export type AiPersonalInsightRequest = z.infer<typeof aiPersonalInsightRequestSchema>;

export const modelPersonalInsightSchema = z.object({
  summary: z.string().trim().min(1).max(400),
  interpretation: z.string().trim().min(1).max(600),
  recommendations: z.array(z.string().trim().min(1).max(220)).min(1).max(3),
  limitations: z.array(z.string().trim().min(1).max(220)).max(4),
  factRefs: z.array(z.number().int().min(0)).min(1).max(8),
});

export type ModelPersonalInsight = z.infer<typeof modelPersonalInsightSchema>;

export const aiPersonalInsightResponseSchema = z.object({
  summary: z.string().trim().min(1).max(400),
  facts: z.array(groundedFactSchema).min(1).max(8),
  interpretation: z.string().trim().min(1).max(600),
  recommendations: z.array(z.string().trim().min(1).max(220)).min(1).max(3),
  limitations: z.array(z.string().trim().min(1).max(220)).max(4),
});

export type AiPersonalInsightResponse = z.infer<typeof aiPersonalInsightResponseSchema>;
