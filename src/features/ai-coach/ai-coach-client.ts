import { httpsCallable } from "firebase/functions";
import { getFirebaseClient } from "@/lib/firebase/client";
import { mapFunctionsError } from "@/lib/errors";
import {
  coachCallResultSchema,
  type AiIntent,
  type CoachCallResult,
  type TargetRef,
} from "./schema";

const FUNCTION_NAME_BY_INTENT: Record<AiIntent, string> = {
  "coach-query": "masteryCoachQuery",
  "planning-recommendations": "generatePlanningRecommendations",
  "goal-breakdown": "generateGoalBreakdown",
  "reflection-questions": "generateReflectionQuestions",
  "execution-patterns": "analyzeExecutionPatterns",
};

export interface CallCoachOptions {
  targetRef?: TargetRef | null;
  userMessage?: string | null;
}

/** Calls the matching Cloud Function for `intent` and validates its response. */
export async function callCoach(
  intent: AiIntent,
  options: CallCoachOptions = {},
): Promise<CoachCallResult> {
  const callable = httpsCallable(getFirebaseClient().functions, FUNCTION_NAME_BY_INTENT[intent]);

  try {
    const result = await callable({
      targetRef: options.targetRef ?? null,
      userMessage: options.userMessage ?? null,
    });
    return coachCallResultSchema.parse(result.data);
  } catch (error) {
    throw mapFunctionsError(error);
  }
}
