import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";

export const DECISION_STATUSES = [
  "DRAFT",
  "ANALYZING",
  "READY",
  "DECIDED",
  "DEFERRED",
  "REJECTED",
  "IMPLEMENTING",
  "COMPLETED",
  "REVIEWED",
  "CANCELLED",
] as const;
export const decisionStatusSchema = z.enum(DECISION_STATUSES);
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export const DECISION_PRIORITY = ["low", "medium", "high", "critical"] as const;
export const decisionPrioritySchema = z.enum(DECISION_PRIORITY);
export type DecisionPriority = (typeof DECISION_PRIORITY)[number];

export const decisionDirectionSchema = z.enum(["higher", "lower"]);
export type DecisionDirection = "higher" | "lower";

export interface DecisionCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  direction: DecisionDirection;
  userDefined: boolean;
}

export interface DecisionOption {
  id: string;
  decisionId: string;
  title: string;
  description: string;
  expectedBenefits: string[];
  expectedCosts: string[];
  requiredEffort: "low" | "medium" | "high";
  risks: string[];
  dependencies: string[];
  opportunityCosts: string[];
  goalAlignment: number;
  constraints: string[];
  evidence: string[];
  assumptions: string[];
  scenarioResults: string[];
  criteriaScores: Record<string, number>;
}

export interface DecisionTradeOff {
  optionId: string;
  benefit: string;
  sacrifice: string;
  affectedArea: string;
  magnitude: "low" | "medium" | "high";
  confidence: "low" | "medium" | "high";
  explanation: string;
}

export interface DecisionRisk {
  optionId: string;
  description: string;
  probability: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  severity: "low" | "medium" | "high";
  mitigation: string;
  confidence: "low" | "medium" | "high";
}

export interface DecisionScenario {
  id: string;
  decisionId: string;
  name: string;
  description: string;
  assumptions: string[];
  expectedResult: string;
  uncertainty: string;
  affectedAreas: string[];
}

export interface DecisionEvidence {
  id: string;
  sourceType: "goal" | "plan" | "prediction" | "task" | "analytics" | "manual";
  sourceId: string;
  sourceDescription: string;
  evidenceType: "trend" | "risk" | "alignment" | "estimate" | "constraint";
  timestamp: string;
  reliability: "low" | "medium" | "high";
  relevance: number;
}

export interface DecisionRecommendation {
  decisionId: string;
  recommendedOptionId: string | null;
  rationale: string;
  evidence: string[];
  assumptions: string[];
  confidence: "low" | "medium" | "high";
  limitations: string[];
  status: "recommended" | "insufficient-data";
}

export interface UserChoice {
  decisionId: string;
  selectedOptionId: string | null;
  choiceType: "CHOOSE" | "DEFER" | "REJECT" | "CONTINUE_ANALYSIS";
  reason: string;
  timestamp: string;
}

export interface DecisionOutcome {
  decisionId: string;
  expectedOutcome: string;
  actualOutcome: string;
  variance: string;
  lessons: string[];
  reviewedAt: string;
}

export interface DecisionRecord {
  id: string;
  title: string;
  description: string;
  status: DecisionStatus;
  createdAt: string;
  updatedAt: string;
  decisionDate: string;
  dueDate?: string;
  domain: string;
  importance: DecisionPriority;
  urgency: DecisionPriority;
  context: string;
  desiredOutcome: string;
  userPriority: string;
  constraints: string[];
  assumptions: string[];
  relatedGoals: string[];
  relatedPlans: string[];
  relatedPredictions: string[];
  relatedRecommendations: string[];
  selectedOptionId: string | null;
  outcome?: DecisionOutcome;
  criteria: DecisionCriterion[];
  options: DecisionOption[];
  tradeOffs: DecisionTradeOff[];
  risks: DecisionRisk[];
  scenarios: DecisionScenario[];
  evidence: DecisionEvidence[];
  recommendation?: DecisionRecommendation;
  reviewDate?: string;
}

export const decisionSchema = defineRecordSchema({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000),
  status: decisionStatusSchema,
  decisionDate: z.string().min(1),
  dueDate: z.string().optional(),
  domain: z.string().trim().min(1).max(100),
  importance: decisionPrioritySchema,
  urgency: decisionPrioritySchema,
  context: z.string().trim().max(4000),
  desiredOutcome: z.string().trim().max(4000),
  userPriority: z.string().trim().max(200),
  constraints: z.array(z.string().trim().min(1)).default([]),
  assumptions: z.array(z.string().trim().min(1)).default([]),
  relatedGoals: z.array(z.string().trim().min(1)).default([]),
  relatedPlans: z.array(z.string().trim().min(1)).default([]),
  relatedPredictions: z.array(z.string().trim().min(1)).default([]),
  relatedRecommendations: z.array(z.string().trim().min(1)).default([]),
  selectedOptionId: z.string().nullable().default(null),
  criteria: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      description: z.string().default(""),
      weight: z.number().min(0).max(1),
      direction: decisionDirectionSchema,
      userDefined: z.boolean().default(false),
    }),
  ),
  options: z.array(
    z.object({
      id: z.string().min(1),
      decisionId: z.string().min(1),
      title: z.string().min(1),
      description: z.string().default(""),
      expectedBenefits: z.array(z.string().min(1)).default([]),
      expectedCosts: z.array(z.string().min(1)).default([]),
      requiredEffort: z.enum(["low", "medium", "high"]),
      risks: z.array(z.string().min(1)).default([]),
      dependencies: z.array(z.string().min(1)).default([]),
      opportunityCosts: z.array(z.string().min(1)).default([]),
      goalAlignment: z.number().min(0).max(100),
      constraints: z.array(z.string().min(1)).default([]),
      evidence: z.array(z.string().min(1)).default([]),
      assumptions: z.array(z.string().min(1)).default([]),
      scenarioResults: z.array(z.string().min(1)).default([]),
      criteriaScores: z.record(z.string(), z.number().min(0).max(10)).default({}),
    }),
  ),
  tradeOffs: z.array(
    z.object({
      optionId: z.string().min(1),
      benefit: z.string().min(1),
      sacrifice: z.string().min(1),
      affectedArea: z.string().min(1),
      magnitude: z.enum(["low", "medium", "high"]),
      confidence: z.enum(["low", "medium", "high"]),
      explanation: z.string().default(""),
    }),
  ),
  risks: z.array(
    z.object({
      optionId: z.string().min(1),
      description: z.string().min(1),
      probability: z.enum(["low", "medium", "high"]),
      impact: z.enum(["low", "medium", "high"]),
      severity: z.enum(["low", "medium", "high"]),
      mitigation: z.string().default(""),
      confidence: z.enum(["low", "medium", "high"]),
    }),
  ),
  scenarios: z.array(
    z.object({
      id: z.string().min(1),
      decisionId: z.string().min(1),
      name: z.string().min(1),
      description: z.string().default(""),
      assumptions: z.array(z.string().min(1)).default([]),
      expectedResult: z.string().default(""),
      uncertainty: z.string().default(""),
      affectedAreas: z.array(z.string().min(1)).default([]),
    }),
  ),
  evidence: z.array(
    z.object({
      id: z.string().min(1),
      sourceType: z.enum(["goal", "plan", "prediction", "task", "analytics", "manual"]),
      sourceId: z.string().min(1),
      sourceDescription: z.string().min(1),
      evidenceType: z.enum(["trend", "risk", "alignment", "estimate", "constraint"]),
      timestamp: z.string().min(1),
      reliability: z.enum(["low", "medium", "high"]),
      relevance: z.number().min(0).max(100),
    }),
  ),
  recommendation: z
    .object({
      decisionId: z.string().min(1),
      recommendedOptionId: z.string().nullable(),
      rationale: z.string().min(1),
      evidence: z.array(z.string().min(1)).default([]),
      assumptions: z.array(z.string().min(1)).default([]),
      confidence: z.enum(["low", "medium", "high"]),
      limitations: z.array(z.string().min(1)).default([]),
      status: z.enum(["recommended", "insufficient-data"]),
    })
    .optional(),
  reviewDate: z.string().optional(),
});
