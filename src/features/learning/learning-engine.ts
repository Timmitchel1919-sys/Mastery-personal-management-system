export type LearningSourceType =
  | "plan"
  | "goal"
  | "task"
  | "focus"
  | "decision"
  | "prediction"
  | "recommendation"
  | "habit"
  | "milestone"
  | "user";

export type LearningEventType =
  | "PLAN_OUTCOME"
  | "GOAL_OUTCOME"
  | "TASK_OUTCOME"
  | "FOCUS_OUTCOME"
  | "DECISION_OUTCOME"
  | "PREDICTION_OUTCOME"
  | "RECOMMENDATION_FEEDBACK"
  | "EXPLICIT_USER_FEEDBACK"
  | "HABIT_OUTCOME"
  | "MILESTONE_OUTCOME";

export type LearningConfidence = "low" | "moderate" | "high";
export type LearningPatternCategory =
  | "PLANNING"
  | "EXECUTION"
  | "FOCUS"
  | "GOALS"
  | "DECISIONS"
  | "PREDICTIONS"
  | "RECOMMENDATIONS"
  | "TIME"
  | "WORKLOAD"
  | "GROWTH";
export type LearningPatternStatus = "active" | "dismissed" | "corrected" | "reset";
export type RecommendationFeedbackStatus =
  | "helpful"
  | "not-helpful"
  | "not-relevant"
  | "too-difficult"
  | "bad-timing"
  | "already-handled"
  | "other";

export interface LearningEvent {
  id: string;
  userId: string;
  timestamp: string;
  sourceType: LearningSourceType;
  sourceId: string;
  eventType: LearningEventType;
  context: Record<string, unknown>;
  expected?: number | null;
  actual?: number | null;
  variance?: number;
  feedback?: string;
  confidence?: LearningConfidence;
  learningValue?: number;
  createdAt: string;
}

export interface LearningPattern {
  id: string;
  userId: string;
  category: LearningPatternCategory;
  description: string;
  evidence: string[];
  occurrences: number;
  confidence: LearningConfidence;
  firstObserved: string;
  lastObserved: string;
  status: LearningPatternStatus;
}

export interface LearningInsight {
  insight: string;
  evidence: string[];
  confidence: LearningConfidence;
  timeframe: string;
  affectedModule: string;
  suggestedAction?: string;
}

export interface RecommendationFeedback {
  recommendationId: string;
  status: RecommendationFeedbackStatus;
  userText?: string;
  createdAt: string;
}

export interface PredictionOutcome {
  prediction: string;
  predictedProbability: number;
  actualOutcome: number;
  error: number;
  confidence: LearningConfidence;
  timestamp: string;
}

export interface DecisionOutcome {
  decisionId: string;
  expectedBenefit: number;
  actualBenefit: number;
  expectedCost: number;
  actualCost: number;
  expectedEffort: number;
  actualEffort: number;
  expectedRisk: number;
  actualRisk: number;
  summary: string;
}

export interface PlanLearningSample {
  plannedDuration: number;
  actualDuration: number;
  plannedWorkload: number;
  actualWorkload: number;
  completionRate: number;
}

export interface PlanLearningResult {
  summary: string;
  proposal: string;
  confidence: LearningConfidence;
  evidence: string[];
}

export type LearningAuditAction = "dismiss" | "correct" | "reset";

const BASE_TIMESTAMP = new Date().toISOString();

function makeId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizedVariance(expected: number | null | undefined, actual: number | null | undefined): number {
  if (expected == null || actual == null) return 0;
  return Number((actual - expected).toFixed(2));
}

export function compareExpectedVsActual(expected: number, actual: number): {
  expected: number;
  actual: number;
  variance: number;
  percentVariance: number;
  direction: "over" | "under" | "match";
  summary: string;
} {
  const variance = Number((actual - expected).toFixed(2));
  const percentVariance = expected === 0 ? 0 : Number((Math.abs(variance) / Math.abs(expected) * 100).toFixed(2));
  const direction = variance > 0 ? "over" : variance < 0 ? "under" : "match";

  const summary =
    direction === "over"
      ? `The task exceeded the original estimate by ${Math.abs(variance)} (${percentVariance}%); similar tasks may benefit from additional planning buffer.`
      : direction === "under"
        ? `The work finished below the original estimate by ${Math.abs(variance)} (${percentVariance}%); the estimate may have been conservative.`
        : `The outcome matched the original estimate exactly.`;

  return { expected, actual, variance, percentVariance, direction, summary };
}

export function createLearningEvent(input: {
  userId: string;
  sourceType: LearningSourceType;
  sourceId: string;
  eventType: LearningEventType;
  context?: Record<string, unknown>;
  expected?: number | null;
  actual?: number | null;
  feedback?: string;
  confidence?: LearningConfidence;
  learningValue?: number;
  timestamp?: string;
}): LearningEvent {
  const expected = input.expected ?? null;
  const actual = input.actual ?? null;
  const variance = normalizedVariance(expected, actual);

  return {
    id: makeId("event"),
    userId: input.userId,
    timestamp: input.timestamp ?? BASE_TIMESTAMP,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    eventType: input.eventType,
    context: input.context ?? {},
    expected,
    actual,
    variance,
    feedback: input.feedback,
    confidence: input.confidence ?? "moderate",
    learningValue: input.learningValue ?? 0,
    createdAt: BASE_TIMESTAMP,
  };
}

export function calculateLearningConfidence(
  sampleSize: number,
  consistency: number,
  recency: number,
  variance: number,
): LearningConfidence {
  const safeConsistency = clamp(Number.isFinite(consistency) ? consistency : 0, 0, 1);
  const safeRecency = clamp(Number.isFinite(recency) ? recency : 0, 0, 1);
  const safeVariance = clamp(Number.isFinite(variance) ? variance : 0, 0, 1);

  if (sampleSize >= 30 && safeConsistency >= 0.75 && safeRecency >= 0.6 && safeVariance <= 0.25) return "high";
  if (sampleSize >= 5 && safeConsistency >= 0.55 && safeRecency >= 0.45 && safeVariance <= 0.5) return "moderate";
  return "low";
}

export function detectLearningPatterns(events: LearningEvent[]): LearningPattern[] {
  if (events.length === 0) return [];

  const grouped = new Map<string, LearningEvent[]>();
  for (const event of events) {
    const key = event.eventType;
    const bucket = grouped.get(key) ?? [];
    bucket.push(event);
    grouped.set(key, bucket);
  }

  const patterns: LearningPattern[] = [];

  for (const [eventType, group] of grouped.entries()) {
    if (group.length === 0) continue;

    const anchor = group[0];
    if (!anchor) continue;

    const averageVariance =
      group.reduce((sum, event) => sum + (event.variance ?? 0), 0) / Math.max(1, group.length);
    const occurrences = group.length;
    const firstObserved = group.reduce(
      (min, current) => (current.timestamp < min ? current.timestamp : min),
      anchor.timestamp,
    );
    const lastObserved = group.reduce(
      (max, current) => (current.timestamp > max ? current.timestamp : max),
      anchor.timestamp,
    );

    if (occurrences < 3) {
      patterns.push({
        id: makeId("pattern"),
        userId: group[0]?.userId ?? "unknown",
        category: categoryFromEventType(eventType),
        description: "Not enough history to establish a reliable pattern.",
        evidence: [`${occurrences} observation${occurrences === 1 ? "" : "s"} recorded`],
        occurrences,
        confidence: "low",
        firstObserved,
        lastObserved,
        status: "active",
      });
      continue;
    }

    const confidence = calculateLearningConfidence(
      occurrences,
      occurrences >= 5 ? 0.8 : 0.6,
      0.7,
      Math.min(1, Math.abs(averageVariance) / 100),
    );

    const description =
      Math.abs(averageVariance) >= 15
        ? `Pattern detected: ${eventType.toLowerCase().replace(/_/g, " ")} outcomes consistently exceeded expectations in the current sample; similar work may benefit from a larger planning buffer.`
        : `Pattern detected: ${eventType.toLowerCase().replace(/_/g, " ")} outcomes stayed close to the original expectation, which suggests the current plan is directionally stable.`;

    patterns.push({
      id: makeId("pattern"),
      userId: group[0]?.userId ?? "unknown",
      category: categoryFromEventType(eventType),
      description,
      evidence: [
        `${occurrences} recorded observations`,
        `Average variance: ${averageVariance > 0 ? "+" : ""}${averageVariance.toFixed(1)}`,
      ],
      occurrences,
      confidence,
      firstObserved,
      lastObserved,
      status: "active",
    });
  }

  return patterns;
}

export function createLearningInsight(pattern: LearningPattern, timeframe: string): LearningInsight {
  return {
    insight: pattern.description,
    evidence: pattern.evidence,
    confidence: pattern.confidence,
    timeframe,
    affectedModule: moduleFromPatternCategory(pattern.category),
    suggestedAction: pattern.description.includes("buffer") ? "Add a small planning buffer and review the next estimate before acting." : undefined,
  };
}

export function buildLearningInsights(patterns: LearningPattern[]): LearningInsight[] {
  return patterns.slice(0, 4).map((pattern) => createLearningInsight(pattern, "last 30 days"));
}

export function recordRecommendationFeedback(input: {
  recommendationId: string;
  status: RecommendationFeedbackStatus;
  userText?: string;
  createdAt?: string;
}): RecommendationFeedback {
  return {
    recommendationId: input.recommendationId,
    status: input.status,
    userText: input.userText,
    createdAt: input.createdAt ?? BASE_TIMESTAMP,
  };
}

export function recordPredictionOutcome(input: {
  prediction: string;
  predictedProbability: number;
  actualOutcome: number;
  confidence?: LearningConfidence;
  timestamp?: string;
}): PredictionOutcome {
  const error = Math.abs(input.actualOutcome - input.predictedProbability);
  return {
    prediction: input.prediction,
    predictedProbability: Number(input.predictedProbability.toFixed(2)),
    actualOutcome: Number(input.actualOutcome.toFixed(2)),
    error: Number(error.toFixed(2)),
    confidence: input.confidence ?? "moderate",
    timestamp: input.timestamp ?? BASE_TIMESTAMP,
  };
}

export function recordDecisionOutcome(input: {
  decisionId: string;
  expectedBenefit: number;
  actualBenefit: number;
  expectedCost: number;
  actualCost: number;
  expectedEffort: number;
  actualEffort: number;
  expectedRisk: number;
  actualRisk: number;
}): DecisionOutcome {
  const summary =
    input.actualBenefit < input.expectedBenefit
      ? "The decision delivered less value than expected, suggesting the estimate or execution plan may need review."
      : "The decision delivered roughly the expected value, which is a useful baseline for later planning.";

  return {
    decisionId: input.decisionId,
    expectedBenefit: input.expectedBenefit,
    actualBenefit: input.actualBenefit,
    expectedCost: input.expectedCost,
    actualCost: input.actualCost,
    expectedEffort: input.expectedEffort,
    actualEffort: input.actualEffort,
    expectedRisk: input.expectedRisk,
    actualRisk: input.actualRisk,
    summary,
  };
}

export function analyzePlanLearning(samples: PlanLearningSample[]): PlanLearningResult {
  if (samples.length === 0) {
    return {
      summary: "Not enough history to establish a reliable pattern.",
      proposal: "Add at least a few completed plans before generating a planning adjustment.",
      confidence: "low",
      evidence: ["No comparable planning data available"],
    };
  }

  const averageDurationRatio =
    samples.reduce((sum, sample) => sum + sample.actualDuration / Math.max(sample.plannedDuration, 1), 0) /
    samples.length;
  const averageWorkloadDelta =
    samples.reduce((sum, sample) => sum + (sample.actualWorkload - sample.plannedWorkload), 0) / samples.length;
  const averageCompletion =
    samples.reduce((sum, sample) => sum + sample.completionRate, 0) / samples.length;

  const summary =
    averageDurationRatio > 1.2 || averageWorkloadDelta > 1
      ? "Plans in this sample consistently ran longer than expected; the pattern suggests more realistic planning and a 20-minute buffer may help."
      : averageCompletion < 0.7
        ? "This plan pattern had a lower completion rate than expected, which suggests a lighter workload or wider milestone spacing."
        : "The current planning pattern is close to forecast, which suggests the plan is usable without major changes.";

  return {
    summary,
    proposal: averageDurationRatio > 1.2 ? "MASTERY proposes adding a 20-minute buffer to similar plans." : "MASTERY proposes reviewing workload distribution before the next plan is committed.",
    confidence: calculateLearningConfidence(samples.length, Math.min(1, averageCompletion + 0.2), 0.7, Math.min(1, Math.abs(averageWorkloadDelta) / 6)),
    evidence: [
      `${samples.length} comparable plans reviewed`,
      `Average duration ratio: ${averageDurationRatio.toFixed(2)}x`,
      `Average completion rate: ${(averageCompletion * 100).toFixed(0)}%`,
    ],
  };
}

export function correctLearningPattern(
  pattern: LearningPattern,
  update: Partial<Pick<LearningPattern, "description" | "evidence" | "status">>,
): LearningPattern {
  return {
    ...pattern,
    description: update.description ?? pattern.description,
    evidence: update.evidence ?? pattern.evidence,
    status: update.status ?? pattern.status,
  };
}

export function dismissPattern(patternId: string): LearningPattern {
  return {
    id: patternId,
    userId: "unknown",
    category: "PLANNING",
    description: "Pattern dismissed by the user.",
    evidence: [],
    occurrences: 0,
    confidence: "low",
    firstObserved: BASE_TIMESTAMP,
    lastObserved: BASE_TIMESTAMP,
    status: "dismissed",
  };
}

export function resetLearning(
  category: LearningPatternCategory | Lowercase<LearningPatternCategory> | string,
): { category: string; status: "reset"; message: string } {
  const normalized = category.toLowerCase();
  return {
    category: normalized,
    status: "reset",
    message: `Learning data has been reset for ${normalized}.`,
  };
}

export function isLearningAuthorizationValid(userId: string, ownerId: string): boolean {
  return userId.trim().length > 0 && userId === ownerId;
}

function categoryFromEventType(eventType: string): LearningPatternCategory {
  switch (eventType) {
    case "PLAN_OUTCOME":
      return "PLANNING";
    case "GOAL_OUTCOME":
      return "GOALS";
    case "FOCUS_OUTCOME":
      return "FOCUS";
    case "DECISION_OUTCOME":
      return "DECISIONS";
    case "PREDICTION_OUTCOME":
      return "PREDICTIONS";
    case "RECOMMENDATION_FEEDBACK":
      return "RECOMMENDATIONS";
    case "TASK_OUTCOME":
      return "EXECUTION";
    case "HABIT_OUTCOME":
      return "GROWTH";
    default:
      return "WORKLOAD";
  }
}

function moduleFromPatternCategory(category: LearningPatternCategory): string {
  switch (category) {
    case "PLANNING":
      return "plan";
    case "EXECUTION":
      return "act";
    case "FOCUS":
      return "focus";
    case "GOALS":
      return "goals";
    case "DECISIONS":
      return "decisions";
    case "PREDICTIONS":
      return "analytics";
    case "RECOMMENDATIONS":
      return "analytics";
    case "TIME":
      return "focus";
    case "WORKLOAD":
      return "plan";
    case "GROWTH":
      return "grow";
    default:
      return "analytics";
  }
}
