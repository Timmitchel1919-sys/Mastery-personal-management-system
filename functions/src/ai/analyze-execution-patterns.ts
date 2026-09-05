import { onCall } from "firebase-functions/https";
import { DEFAULT_RUNTIME_OPTIONS } from "../config/region";
import { adminDb } from "../shared/firebase-admin";
import { handleAiIntent } from "./shared/handler";
import { ANTHROPIC_API_KEY, getAiProvider } from "./shared/provider-factory";

/** Planned-vs-actual pattern analysis. See `docs/AI_ARCHITECTURE.md`. */
export const analyzeExecutionPatterns = onCall(
  { ...DEFAULT_RUNTIME_OPTIONS, secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 60 },
  (request) =>
    handleAiIntent("execution-patterns", request, { db: adminDb(), provider: getAiProvider() }),
);
