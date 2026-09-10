import { onCall } from "firebase-functions/https";
import { DEFAULT_RUNTIME_OPTIONS } from "../config/region";
import { adminDb } from "../shared/firebase-admin";
import { ANTHROPIC_API_KEY, getAiProvider } from "./shared/provider-factory";
import { handleGeneratePersonalInsight } from "./personal-insight/handler";

/**
 * Layer H optional natural-language interpretation over deterministic intelligence context.
 * Read-only: returns structured explanation; never mutates user application records.
 */
export const generatePersonalInsight = onCall(
  { ...DEFAULT_RUNTIME_OPTIONS, secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 60 },
  (request) => handleGeneratePersonalInsight(request, { db: adminDb(), provider: getAiProvider() }),
);
