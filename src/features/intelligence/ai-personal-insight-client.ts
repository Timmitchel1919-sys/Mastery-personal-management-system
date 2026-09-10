import { httpsCallable } from "firebase/functions";
import { mapFunctionsError } from "@/lib/errors";
import { getFirebaseClient } from "@/lib/firebase/client";
import {
  aiPersonalInsightContextSchema,
  aiPersonalInsightResponseSchema,
  type AiPersonalInsightContext,
  type AiPersonalInsightResponse,
} from "./ai-personal-insight-schema";

const FUNCTION_NAME = "generatePersonalInsight";

export async function generateAiPersonalInsight(
  context: AiPersonalInsightContext,
): Promise<AiPersonalInsightResponse> {
  const validated = aiPersonalInsightContextSchema.parse(context);
  const callable = httpsCallable(getFirebaseClient().functions, FUNCTION_NAME);

  try {
    const result = await callable(validated);
    return aiPersonalInsightResponseSchema.parse(result.data);
  } catch (error) {
    throw mapFunctionsError(error);
  }
}
