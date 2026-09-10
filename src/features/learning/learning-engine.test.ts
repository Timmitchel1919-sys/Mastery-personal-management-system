import { describe, expect, it } from "vitest";
import {
  analyzePlanLearning,
  calculateLearningConfidence,
  compareExpectedVsActual,
  correctLearningPattern,
  createLearningEvent,
  detectLearningPatterns,
  dismissPattern,
  recordDecisionOutcome,
  recordPredictionOutcome,
  recordRecommendationFeedback,
  resetLearning,
} from "./learning-engine";

describe("learning engine", () => {
  it("creates a learning event with expected vs actual variance", () => {
    const event = createLearningEvent({
      userId: "user-1",
      sourceType: "plan",
      sourceId: "plan-1",
      eventType: "PLAN_OUTCOME",
      context: { module: "plan" },
      expected: 60,
      actual: 95,
      feedback: "The plan was too optimistic.",
      confidence: "moderate",
      learningValue: 0.7,
    });

    expect(event.id).toBeTruthy();
    expect(event.variance).toBe(35);
    expect(event.expected).toBe(60);
    expect(event.actual).toBe(95);
  });

  it("calculates expected vs actual variance and percent delta", () => {
    const result = compareExpectedVsActual(60, 95);
    expect(result.variance).toBe(35);
    expect(result.percentVariance).toBeCloseTo(58.33, 2);
    expect(result.direction).toBe("over");
    expect(result.summary).toContain("exceeded");
  });

  it("detects a pattern only when evidence is strong enough", () => {
    const events = Array.from({ length: 6 }, (_, index) =>
      createLearningEvent({
        userId: "user-1",
        sourceType: "plan",
        sourceId: `plan-${index}`,
        eventType: "PLAN_OUTCOME",
        context: { module: "plan", workload: "overloaded" },
        expected: 75,
        actual: 120,
        confidence: "moderate",
        learningValue: 0.6,
      }),
    );

    const patterns = detectLearningPatterns(events);
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0]?.description).toContain("plan");
    expect(patterns[0]?.confidence).toBe("moderate");
  });

  it("returns insufficient-data guidance when there is not enough history", () => {
    const patterns = detectLearningPatterns([
      createLearningEvent({
        userId: "user-1",
        sourceType: "focus",
        sourceId: "focus-1",
        eventType: "FOCUS_OUTCOME",
        context: { module: "focus" },
        expected: 50,
        actual: 40,
      }),
      createLearningEvent({
        userId: "user-1",
        sourceType: "focus",
        sourceId: "focus-2",
        eventType: "FOCUS_OUTCOME",
        context: { module: "focus" },
        expected: 60,
        actual: 55,
      }),
    ]);

    expect(patterns[0]?.description).toContain("Not enough history");
  });

  it("calculates confidence from sample size and quality", () => {
    expect(calculateLearningConfidence(3, 0.8, 0.9, 0.2)).toBe("low");
    expect(calculateLearningConfidence(8, 0.7, 0.7, 0.2)).toBe("moderate");
    expect(calculateLearningConfidence(30, 0.85, 0.9, 0.1)).toBe("high");
  });

  it("records recommendation feedback and preserves user choices", () => {
    const feedback = recordRecommendationFeedback({
      recommendationId: "rec-1",
      status: "helpful",
      userText: "This fit the time window better than expected.",
    });

    expect(feedback.status).toBe("helpful");
    expect(feedback.userText).toContain("time window");
  });

  it("tracks prediction outcomes and decision outcomes from real results", () => {
    const prediction = recordPredictionOutcome({
      prediction: "Goal deadline risk is elevated.",
      predictedProbability: 0.68,
      actualOutcome: 0.3,
      confidence: "moderate",
      timestamp: "2026-08-01T00:00:00.000Z",
    });

    const decision = recordDecisionOutcome({
      decisionId: "decision-1",
      expectedBenefit: 7,
      actualBenefit: 4,
      expectedCost: 4,
      actualCost: 7,
      expectedEffort: 5,
      actualEffort: 6,
      expectedRisk: 3,
      actualRisk: 5,
    });

    expect(prediction.error).toBeCloseTo(0.38, 2);
    expect(decision.actualBenefit).toBe(4);
    expect(decision.actualCost).toBe(7);
  });

  it("uses goal-plan evidence to build a plan learning summary and adaptive proposal", () => {
    const analysis = analyzePlanLearning([
      { plannedDuration: 60, actualDuration: 95, plannedWorkload: 3, actualWorkload: 5, completionRate: 0.7 },
      { plannedDuration: 60, actualDuration: 80, plannedWorkload: 3, actualWorkload: 4, completionRate: 0.8 },
      { plannedDuration: 60, actualDuration: 90, plannedWorkload: 3, actualWorkload: 5, completionRate: 0.6 },
      { plannedDuration: 60, actualDuration: 75, plannedWorkload: 3, actualWorkload: 4, completionRate: 0.9 },
      { plannedDuration: 60, actualDuration: 110, plannedWorkload: 3, actualWorkload: 6, completionRate: 0.5 },
    ]);

    expect(analysis.summary).toMatch(/buffer|overloaded|planning/i);
    expect(analysis.proposal).toContain("20");
    expect(analysis.confidence).not.toBe("low");
  });

  it("supports user correction, dismissal, and reset", () => {
    const pattern = detectLearningPatterns([
      createLearningEvent({
        userId: "user-1",
        sourceType: "goal",
        sourceId: "goal-1",
        eventType: "GOAL_OUTCOME",
        context: { module: "goals" },
        expected: 80,
        actual: 55,
        confidence: "moderate",
      }),
      createLearningEvent({
        userId: "user-1",
        sourceType: "goal",
        sourceId: "goal-2",
        eventType: "GOAL_OUTCOME",
        context: { module: "goals" },
        expected: 75,
        actual: 60,
        confidence: "moderate",
      }),
      createLearningEvent({
        userId: "user-1",
        sourceType: "goal",
        sourceId: "goal-3",
        eventType: "GOAL_OUTCOME",
        context: { module: "goals" },
        expected: 70,
        actual: 50,
        confidence: "moderate",
      }),
      createLearningEvent({
        userId: "user-1",
        sourceType: "goal",
        sourceId: "goal-4",
        eventType: "GOAL_OUTCOME",
        context: { module: "goals" },
        expected: 72,
        actual: 62,
        confidence: "moderate",
      }),
      createLearningEvent({
        userId: "user-1",
        sourceType: "goal",
        sourceId: "goal-5",
        eventType: "GOAL_OUTCOME",
        context: { module: "goals" },
        expected: 68,
        actual: 48,
        confidence: "moderate",
      }),
    ])[0];

    const corrected = correctLearningPattern(pattern!, {
      description: "Observed goal completion was lower than planned across the last five reviews.",
      evidence: ["Five completed goal outcomes reviewed."],
      status: "corrected",
    });

    expect(corrected.status).toBe("corrected");
    expect(dismissPattern(corrected.id).status).toBe("dismissed");
    expect(resetLearning("goals").category).toBe("goals");
  });
});
