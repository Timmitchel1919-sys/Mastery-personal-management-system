import { onRequest } from "firebase-functions/https";
import { DEFAULT_REGION } from "./config/region";

export { masteryCoachQuery } from "./ai/mastery-coach-query";
export { generatePlanningRecommendations } from "./ai/generate-planning-recommendations";
export { generateGoalBreakdown } from "./ai/generate-goal-breakdown";
export { generateReflectionQuestions } from "./ai/generate-reflection-questions";
export { analyzeExecutionPatterns } from "./ai/analyze-execution-patterns";
export { generateWeeklySummary } from "./scheduled/generate-weekly-summary";
export { recordRecoverySetback } from "./recovery/record-recovery-setback";

/**
 * Mastery Cloud Functions entrypoint.
 *
 * Domain functions are added by later layers and re-exported here:
 *   - ai/            Layer 13 — masteryCoachQuery + the generate/analyze endpoints
 *                    (above). recoveryCoachQuery is a separate, isolated endpoint
 *                    (Layer 15E).
 *   - scheduled/     Layer 14 — generateWeeklySummary (above); reminder sweeps join it in
 *                    Layer 17.
 *   - recovery/      Layer 15C — recordRecoverySetback (above, the only writer of
 *                    relapse records per RECOVERY_PRIVACY.md §3). recoveryCoachQuery
 *                    (15E) and accountability access (15F) join it later.
 *   - reports/       Layer 16
 *   - notifications/ Layer 17
 *
 * Written and tested through Layer 15C; NOT YET DEPLOYED — the project is on the Spark
 * plan and Cloud Functions deploy needs Blaze (owner's call, see ADR-0017).
 */

/** Unauthenticated liveness probe. Does not touch Firestore or auth. */
export const healthCheck = onRequest(
  { region: DEFAULT_REGION, cors: true, memory: "128MiB" },
  (_request, response) => {
    response.json({
      status: "ok",
      service: "mastery-functions",
      timestamp: new Date().toISOString(),
    });
  },
);
